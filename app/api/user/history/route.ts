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

    // 🔥 3. NUEVO: Shopper Orders (Compras)
    const shopperOrders = await prisma.shopperOrder.findMany({
        where: { 
            userId,
            status: { not: 'PENDING_QUOTE' } // Ocultamos cotizaciones que aún no se han pagado o aprobado
        },
        include: { items: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
    });

    // 🔥 4. NUEVO: Mailbox Transactions (Buzón Virtual)
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
        // 🔥 CLASIFICACIÓN ESTRICTA QUE RESPETA EL NUEVO ESQUEMA ENTERPRISE
        const isStorage = ship.serviceType === 'STORAGE_FEE';
        const isStorePickup = ship.serviceType === 'STORE_PICKUP';
        
        const finalType = isStorePickup ? 'STORE_PICKUP' : (isStorage ? 'STORAGE_FEE' : 'SHIPPING_INTL'); 
        
        // Generamos un string con los nombres de los paquetes
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
                : (isStorePickup ? `Retiro en Tienda (${ship.selectedCourier || 'GMC'})` : `Envío Internacional (${ship.selectedCourier || 'GMC'})`),
            
            totalPaid: ship.totalAmount,
            courier: ship.selectedCourier,

            // EL DETALLE
            service: isStorage 
                ? `${ship.packages.length} paquetes` 
                : packageContent, 
            
            tracking: ship.finalTrackingNumber, 
            packagesCount: ship.packages.length
        };
    });

    // 🔥 NORMALIZAR SHOPPER
    const normalizedShopper = shopperOrders.map(order => ({
        id: order.id,
        createdAt: order.createdAt,
        status: order.status,
        serviceType: order.serviceType || 'PERSONAL_SHOPPER',
        description: `Personal Shopper (${order.items.length} items)`,
        totalPaid: order.totalAmount || order.itemsSubtotal || 0,
        service: order.items.length > 0 ? order.items.map(i => i.name).join(', ') : 'Compra Asistida'
    }));

    // 🔥 NORMALIZAR MAILBOX
    const normalizedMailbox = mailboxTransactions.map(tx => ({
        id: tx.id,
        createdAt: tx.createdAt,
        status: tx.status,
        serviceType: 'MAILBOX', // El Frontend lo acomodará en 'Services' con el ícono de Buzón
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
        ...normalizedShopper,
        ...normalizedMailbox
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ requests: allRequests });

  } catch (error) {
    console.error("Error history:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}