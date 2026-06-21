import { NextResponse } from "next/server";

// --- Tarifas ---
const STORAGE_FREE_DAYS = 30;
const STORAGE_RATE_PER_CFT = 2.25;

// Forzamos dinamismo para evitar caché en Vercel/Next.js
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const prisma = (await import("@/lib/prisma")).default;
    const { auth } = await import("@/auth");
    
    const { 
        sendPaymentReceiptEmail, 
        sendConsolidationRequestEmail, 
        sendAdminConsolidationAlert,   
        getT 
    } = await import('@/lib/notifications');

    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { 
        packageIds, 
        type, 
        scheduledDate, scheduledTime,
        selectedCourier, courierService, totalWeight, subtotal, processingFee, totalPaid, stripePaymentId, 
        shippingAddress 
    } = body;

    if (!packageIds || packageIds.length === 0) {
        return NextResponse.json({ message: "No has seleccionado ningún paquete." }, { status: 400 });
    }

    // 🚨 VALIDACIÓN DE SEGURIDAD: Evitar doble procesamiento
    const existingUsage = await prisma.package.findFirst({
        where: {
            id: { in: packageIds },
            OR: [
                { status: 'EN_PROCESO_ENVIO' },
                { status: 'PENDIENTE_RETIRO' },
                { status: 'ENTREGADO' },
                { consolidatedShipmentId: { not: null } }
            ]
        }
    });

    if (existingUsage) {
        return NextResponse.json({ 
            message: "⚠️ Error: Uno o más paquetes ya fueron procesados. Por favor actualiza la página." 
        }, { status: 409 });
    }

    // =======================================================================
    // 🚚 CASO 1: RECOGIDA EN BODEGA (PICKUP)
    // =======================================================================
    if (type === 'WAREHOUSE_PICKUP') {
        const packages = await prisma.package.findMany({ where: { id: { in: packageIds }, userId: session.user.id } });
        
        let calculatedTotal = 0;
        
        packages.forEach(pkg => {
            const now = new Date();
            
            const isDocument = pkg.courier === 'Buzón Virtual' || (pkg.carrierTrackingNumber || '').startsWith('DOC-') || (pkg.gmcTrackingNumber || '').startsWith('GMC-DOC-') || pkg.description === "Documento Físico (Enviado desde Buzón)";
            
            let handling = 0;
            if (!isDocument) {
                const w = pkg.weightLbs || 1;
                if (w <= 10) handling = 2.50;
                else if (w <= 50) handling = 5.00;
                else if (w <= 150) handling = 12.50;
                else handling = 30.00;
            }

            let storage = 0;
            const paidUntil = pkg.storagePaidUntil ? new Date(pkg.storagePaidUntil) : null;
            
            const length = Number(pkg.lengthIn) || 12;
            const width = Number(pkg.widthIn) || 12;
            const height = Number(pkg.heightIn) || 10;
            const vol = (length * width * height) / 1728;

            if (paidUntil) {
                 const diffSincePaid = now.getTime() - paidUntil.getTime();
                 const daysPending = Math.floor(diffSincePaid / (1000 * 60 * 60 * 24));
                 if (daysPending > 0) {
                     const dailyRate = (vol * STORAGE_RATE_PER_CFT) / 30;
                     storage = daysPending * dailyRate;
                 }
            } else {
                 const daysTotal = Math.ceil(Math.abs(now.getTime() - new Date(pkg.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                 if (daysTotal > STORAGE_FREE_DAYS) {
                     const overdueDays = daysTotal - STORAGE_FREE_DAYS;
                     const dailyRate = (vol * STORAGE_RATE_PER_CFT) / 30;
                     storage = overdueDays * dailyRate;
                 }
            }
            calculatedTotal += (handling + storage);
        });

        const pickupShipment = await prisma.consolidatedShipment.create({
            data: {
                userId: session.user.id,
                gmcShipmentNumber: `PICKUP-${Date.now().toString().slice(-6)}`,
                status: 'PENDIENTE_PAGO',
                destinationCountryCode: 'USA', // Un pickup siempre es en Miami
                serviceType: 'PICKUP', 
                courierService: `Cita: ${scheduledDate} ${scheduledTime}`,
                totalAmount: parseFloat(calculatedTotal.toFixed(2)),
                subtotalAmount: parseFloat(calculatedTotal.toFixed(2)), 
                weightLbs: packages.reduce((acc, p) => acc + (p.weightLbs || 0), 0),
                packages: { connect: packageIds.map((id: string) => ({ id })) }
            }
        });

        await prisma.package.updateMany({
            where: { id: { in: packageIds } },
            data: { 
                status: 'PENDIENTE_RETIRO',        
                selectedCourier: 'CLIENTE_RETIRO', 
                courierService: `Cita: ${scheduledDate} ${scheduledTime}` 
            }
        });

        return NextResponse.json({ success: true, shipmentId: pickupShipment.id });
    }

    // =======================================================================
    // ✈️ / 🚢 CASO 2: CONSOLIDACIÓN / ENVÍO INT. / LOCAL DELIVERY / OCEAN
    // =======================================================================
    
    const packagesToConsolidate = await prisma.package.findMany({ 
        where: { id: { in: packageIds }, userId: session.user.id } 
    });

    let normalBoxesCount = 0;
    let documentsCount = 0;

    packagesToConsolidate.forEach(pkg => {
        const isDocument = pkg.courier === 'Buzón Virtual' || 
                           (pkg.carrierTrackingNumber || '').startsWith('DOC-') || 
                           (pkg.gmcTrackingNumber || '').startsWith('GMC-DOC-') ||
                           pkg.description === "Documento Físico (Enviado desde Buzón)";
        
        if (isDocument) {
            documentsCount++;
        } else {
            normalBoxesCount++;
        }
    });

    const shipmentNumber = `GMC-SHIP-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // 💥 ARQUITECTURA ENTERPRISE: Identidad separada de la Operación
    let finalServiceType = 'SHIPPING_INTL';
    let initialStatus = 'PAGADO'; 

    if (type === 'LOCAL_DELIVERY') {
        finalServiceType = 'LOCAL_DELIVERY'; // <- Le dice al chofer y al Admin qué hacer
        initialStatus = 'SOLICITUD_CONSOLIDACION'; 
    } else if (type === 'OCEAN_CONSOLIDATION') {
        finalServiceType = 'OCEAN_CONSOLIDATION'; // 🔥 Reconoce servicio Marítimo y avisa al Admin
        initialStatus = 'SOLICITUD_CONSOLIDACION';
    } else if (type === 'CONSOLIDATION' || packageIds.length > 1) {
        finalServiceType = 'CONSOLIDATION'; // Aéreo por defecto
        initialStatus = 'SOLICITUD_CONSOLIDACION'; 
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { countryCode: true }
    });

    // 1. IDENTIDAD DEL CLIENTE: Intacta (Mantiene TT, INTL, etc.)
    const finalCountryCode = user?.countryCode || 'INTL';

    // 2. OPERACIÓN: Etiqueta inteligente para el equipo de almacén
    let smartCourierService = courierService;
    if (finalServiceType === 'LOCAL_DELIVERY') {
         smartCourierService = "LOCAL DELIVERY (AURA)"; 
    } else if (finalServiceType === 'OCEAN_CONSOLIDATION') {
         smartCourierService = "CONSOLIDACIÓN MARÍTIMA"; // 🔥 Nombre visual para la operación interna
    } else if (finalServiceType === 'CONSOLIDATION') {
        if (normalBoxesCount === 0 && documentsCount > 0) {
            smartCourierService = "SOLO DOCUMENTOS (CONSOLIDACIÓN GRATIS)";
        } else if (documentsCount > 0) {
            smartCourierService = `MIXTO: ${normalBoxesCount} Caja(s) + ${documentsCount} Doc(s) Gratis`;
        }
    }

    const shipment = await prisma.consolidatedShipment.create({
        data: {
            userId: session.user.id,
            gmcShipmentNumber: shipmentNumber,
            status: initialStatus,
            destinationCountryCode: finalCountryCode, // <-- ¡Respeta si Nelsom es de Trinidad!
            serviceType: finalServiceType,            // <-- ¡Manda la señal a ConsolidationCard.tsx!
            
            subtotalAmount: subtotal,
            processingFee: processingFee,
            totalAmount: totalPaid,
            paymentId: stripePaymentId,
            selectedCourier,
            courierService: smartCourierService || null, 
            weightLbs: totalWeight,
            shippingAddress: shippingAddress || null,
            packages: { connect: packageIds.map((id: string) => ({ id })) }
        }
    });

    // Actualizamos paquetes
    const newPackageStatus = (finalServiceType === 'CONSOLIDATION' || finalServiceType === 'OCEAN_CONSOLIDATION' || finalServiceType === 'LOCAL_DELIVERY') 
        ? 'EN_PROCESO_CONSOLIDACION' 
        : 'EN_PROCESO_ENVIO';

    await prisma.package.updateMany({
        where: { id: { in: packageIds } },
        data: { 
            status: newPackageStatus, 
            selectedCourier, 
            courierService,
            consolidatedShipmentId: shipment.id 
        }
    });

    // =========================================================================
    // 🔔 NOTIFICACIONES
    // =========================================================================
    try {
        const userLang = (session.user as any).language || 'en';
        
        if (finalServiceType === 'CONSOLIDATION' || finalServiceType === 'OCEAN_CONSOLIDATION' || finalServiceType === 'LOCAL_DELIVERY') {
            console.log("🔄 Enviando email de Solicitud de Consolidación / Delivery / Ocean...");
            
            await sendConsolidationRequestEmail(
                session.user.email || '', 
                session.user.name || 'Cliente', 
                packageIds.length, 
                shipment.gmcShipmentNumber,
                userLang
            );

            await sendAdminConsolidationAlert(
                session.user.name || 'Cliente', 
                packageIds.length, 
                shipment.gmcShipmentNumber
            );

        } else {
            console.log("💰 Enviando Recibo de Pago...");
            
            const safeTotal = typeof totalPaid === 'number' ? totalPaid : 0;
            const typeLabel = packageIds.length > 1 ? "Consolidación Pagada" : "Envío Individual";
            
            await sendPaymentReceiptEmail(
                session.user.email || '', 
                session.user.name || 'Cliente', 
                `Envío Internacional (${selectedCourier})`, 
                safeTotal,
                shipment.gmcShipmentNumber, 
                `${typeLabel} de ${packageIds.length} paquete(s). Destino: ${shippingAddress || 'N/A'}`,
                userLang
            );
        }

    } catch (e) { console.error("Error notificando:", e); }

    return NextResponse.json({ success: true, shipmentId: shipment.id });

  } catch (error: any) {
    console.error("Error creando envío:", error);
    return NextResponse.json({ message: "Error interno al crear envío." }, { status: 500 });
  }
}