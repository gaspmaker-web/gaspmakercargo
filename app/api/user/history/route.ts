import { NextResponse } from "next/server";

// 👇 VACUNA 1: Forzar modo dinámico
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 👇 VACUNA 2: Imports dentro de la función (Lazy Loading)
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;

    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const userId = session.user.id;

    // 1. Pickup Requests (Logística Local)
    const localRequests = await prisma.pickupRequest.findMany({
        where: { userId }, orderBy: { createdAt: 'desc' }
    });

    // 2. Consolidated Shipments (Incluimos paquetes para leer sus descripciones)
    const internationalShipments = await prisma.consolidatedShipment.findMany({
        where: { userId }, 
        include: { 
            packages: {
                select: { description: true, gmcTrackingNumber: true }
            } 
        }, 
        orderBy: { createdAt: 'desc' }
    });

    // 🔥 3. NUEVO: Paquetes Individuales Pagados (AQUÍ ESTÁ TU PAQUETE 51265DFF)
    const singlePackages = await prisma.package.findMany({
        where: { 
            userId, 
            stripePaymentId: { not: null }, 
            consolidatedShipmentId: null // Solo los que viajaron solos
        },
        orderBy: { createdAt: 'desc' }
    });

    // 4. Shopper Orders (Compras)
    const shopperOrders = await prisma.shopperOrder.findMany({
        where: { 
            userId,
            status: { not: 'PENDING_QUOTE' } // Ocultamos cotizaciones que aún no se han pagado o aprobado
        },
        include: { items: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
    });

    // 5. Mailbox Transactions (Buzón Virtual)
    const mailboxTransactions = await prisma.mailboxTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
    });

    // ==========================================
    // 🔄 NORMALIZACIÓN DE DATOS
    // ==========================================

    const normalizedLocal = localRequests.map(req => ({
        id: req.id,
        createdAt: req.createdAt,
        status: req.status,
        serviceType: req.serviceType, 
        description: req.description,
        totalPaid: req.totalPaid,
        originAddress: req.originAddress,
        dropOffAddress: req.dropOffAddress,
        photoPickupUrl: req.photoPickupUrl,
        photoDeliveryUrl: req.photoDeliveryUrl,
        signatureUrl: req.signatureUrl, 
        tookanLink: req.tookanLink      
    }));

    const normalizedIntl = internationalShipments.map(ship => {
        // 🔥 ESCÁNER DE DESTINO PARA CONSOLIDADOS
        const addr = (typeof ship.shippingAddress === 'string' ? ship.shippingAddress : JSON.stringify(ship.shippingAddress || '')).toUpperCase();
        const courierSvc = (ship.courierService || '').toUpperCase();
        
        const isLocal = addr.includes('MIAMI') || addr.includes('FL') || addr.includes('DORAL') || addr.includes('MEDLEY') || addr.includes('AURA') || courierSvc.includes('AURA') || courierSvc.includes('LOCAL');

        const isStorage = ship.serviceType === 'STORAGE_FEE';
        const isStorePickup = ship.serviceType === 'STORE_PICKUP';
        
        const finalType = isLocal ? 'DELIVERY' : (isStorePickup ? 'STORE_PICKUP' : (isStorage ? 'STORAGE_FEE' : 'SHIPPING_INTL')); 
        
        const packageContent = ship.packages.length > 0
            ? ship.packages.map(p => p.description || p.gmcTrackingNumber || 'Paquete').join(', ')
            : 'Sin detalle de contenido';

        return {
            id: ship.id,
            createdAt: ship.createdAt,
            status: ship.status,
            serviceType: finalType, 
            
            // EL TÍTULO
            description: isStorage 
                ? `Retiro en Bodega` 
                : (isLocal ? `Entrega Local (Aura)` : (isStorePickup ? `Retiro en Tienda (${ship.selectedCourier || 'GMC'})` : `Envío Internacional (${ship.selectedCourier || 'GMC'})`)),
            
            totalPaid: ship.totalAmount,
            courier: ship.selectedCourier || ship.courierService,

            // EL DETALLE
            service: isStorage 
                ? `${ship.packages.length} paquetes` 
                : packageContent, 
            
            tracking: ship.finalTrackingNumber, 
            packagesCount: ship.packages.length
        };
    });

    // 🔥 NORMALIZAR PAQUETES INDIVIDUALES
    const normalizedSinglePackages = singlePackages.map(pkg => {
        const addr = (typeof pkg.shippingAddress === 'string' ? pkg.shippingAddress : JSON.stringify(pkg.shippingAddress || '')).toUpperCase();
        const courierSvc = (pkg.courierService || '').toUpperCase();
        
        // 🕵️‍♂️ LECTURA DE LA CASILLA COURIER SERVICE QUE MENCIONASTE
        const isLocal = addr.includes('MIAMI') || addr.includes('FL') || addr.includes('DORAL') || addr.includes('MEDLEY') || addr.includes('AURA') || courierSvc.includes('AURA') || courierSvc.includes('LOCAL');
        
        const finalType = isLocal ? 'DELIVERY' : (pkg.serviceType || 'SHIPPING_INTL');

        return {
            id: pkg.id,
            createdAt: pkg.createdAt,
            status: pkg.status,
            serviceType: finalType, // Si es Local, el frontend lo enviará a la pestaña DELIVERY
            description: isLocal ? `Entrega Local (Aura)` : (pkg.description || `Envío Individual`),
            totalPaid: pkg.shippingTotalPaid || 0,
            courier: pkg.courierService || pkg.selectedCourier,
            service: pkg.description || pkg.gmcTrackingNumber,
            tracking: pkg.finalTrackingNumber || pkg.gmcTrackingNumber,
            packagesCount: 1
        };
    });

    // NORMALIZAR SHOPPER
    const normalizedShopper = shopperOrders.map(order => ({
        id: order.id,
        createdAt: order.createdAt,
        status: order.status,
        serviceType: order.serviceType || 'PERSONAL_SHOPPER',
        description: `Personal Shopper (${order.items.length} items)`,
        totalPaid: order.totalAmount || order.itemsSubtotal || 0,
        service: order.items.length > 0 ? order.items.map(i => i.name).join(', ') : 'Compra Asistida'
    }));

    // NORMALIZAR MAILBOX
    const normalizedMailbox = mailboxTransactions.map(tx => ({
        id: tx.id,
        createdAt: tx.createdAt,
        status: tx.status,
        serviceType: 'MAILBOX', 
        description: tx.description || 'Suscripción Buzón Virtual',
        totalPaid: tx.amount,
        service: 'Gestión Interna / Servicio'
    }));

    // ==========================================
    // 📦 COMBINAR Y ORDENAR
    // ==========================================

    const allRequests = [
        ...normalizedLocal, 
        ...normalizedIntl,
        ...normalizedSinglePackages, // 🔥 Inyectamos los paquetes individuales
        ...normalizedShopper,
        ...normalizedMailbox
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ requests: allRequests });

  } catch (error) {
    console.error("Error history:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}