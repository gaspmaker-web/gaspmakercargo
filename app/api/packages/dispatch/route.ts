import { NextResponse } from "next/server";

// 👇 VACUNA 1: Forzar modo dinámico
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 👇 VACUNA 2: Imports Lazy Loading
    const prisma = (await import("@/lib/prisma")).default;
    const { auth } = await import("@/auth");
    const { sendPackageDispatchedEmail } = await import("@/lib/notifications");

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { packageId, finalTrackingNumber, type, staffName, driverName, action } = body;

    if (!packageId) {
        return NextResponse.json({ message: "Falta el ID del paquete" }, { status: 400 });
    }

    // --- LÓGICA DE ESTADOS ---
    let newStatus = 'ENVIADO'; 
    let trackingInfo = finalTrackingNumber;
    let serviceInfo = ''; 

    // 1. CASO: RECEPCIÓN EN DESTINO (Botón Morado)
    if (action === 'RECEIVE_IN_DESTINATION') {
        newStatus = 'EN_REPARTO';
        console.log(`📥 Recibiendo en destino (EN_REPARTO): ${packageId}`);
    } 
    // 2. CASO: ENTREGA EN TIENDA (Pickup Cliente)
    else if (staffName) {
        newStatus = 'ENTREGADO';
        serviceInfo = `Entregado en Tienda por: ${staffName}`;
        trackingInfo = 'RETIRADO_EN_TIENDA';
        console.log(`👤 Entregando en tienda (ENTREGADO): ${packageId}`);
    }
    // 3. CASO: SALIDA / ENVÍO CON DRIVER (Botón Verde)
    else {
        newStatus = 'ENVIADO';
        // 🔥 ACTUALIZADO: Usamos "Driver" para coincidir con el Rol
        if (driverName) {
            serviceInfo = `Driver Salida: ${driverName}`;
        }
        
        if (!finalTrackingNumber) {
             return NextResponse.json({ message: "Falta Tracking Number para despacho" }, { status: 400 });
        }
        console.log(`🚚 Despachando Courier/Driver (ENVIADO): ${packageId}`);
    }

    let updatedRecord: any;
    let shipmentId;

    // 👇 EJECUCIÓN EN BASE DE DATOS
    
    if (type === 'CONSOLIDATION') {
        updatedRecord = await prisma.consolidatedShipment.update({
            where: { id: packageId },
            data: {
                status: newStatus,
                ...(staffName && { courierService: serviceInfo, finalTrackingNumber: trackingInfo }),
                ...(newStatus === 'ENVIADO' && driverName && { courierService: serviceInfo }),
                ...(newStatus === 'ENVIADO' && finalTrackingNumber && { finalTrackingNumber: finalTrackingNumber }),
                updatedAt: new Date()
            },
            include: { user: true }
        });

        // Actualizar hijos
        await prisma.package.updateMany({
            where: { consolidatedShipmentId: packageId },
            data: { status: newStatus, updatedAt: new Date() }
        });

        shipmentId = updatedRecord.gmcShipmentNumber;

    } else {
        updatedRecord = await prisma.package.update({
            where: { id: packageId },
            data: {
                status: newStatus,
                ...(staffName && { deliverySignature: `Staff: ${staffName}`, gmcTrackingNumber: trackingInfo }),
                // 🔥 ACTUALIZADO: Guardamos "Driver: [Nombre]"
                ...(newStatus === 'ENVIADO' && driverName && { deliverySignature: `Driver: ${driverName}` }),
                ...(newStatus === 'ENVIADO' && finalTrackingNumber && { gmcTrackingNumber: finalTrackingNumber }),
                updatedAt: new Date()
            },
            include: { user: true }
        });

        shipmentId = updatedRecord.gmcTrackingNumber;
    }

    // ENVIAR CORREO
    if (updatedRecord && updatedRecord.user && newStatus !== 'EN_REPARTO') {
        try {
            const clientName = updatedRecord.user.name || 'Cliente';
            const refId = shipmentId || 'Envío';
            let emailMessage = "";

            if (newStatus === 'ENTREGADO') {
                emailMessage = `Hola ${clientName}, tu envío (${refId}) ha sido entregado en tienda. Atendido por: ${staffName}.`;
            } else if (newStatus === 'ENVIADO') {
                const courierName = updatedRecord.selectedCourier || 'Transportista';
                // 🔥 ACTUALIZADO: Texto en el correo
                const driverText = driverName ? ` (Driver: ${driverName})` : '';
                emailMessage = `Hola ${clientName}, tu envío (${refId}) ha salido hacia su destino vía ${courierName}${driverText}. Tracking: ${finalTrackingNumber}.`;
            }

            await sendPackageDispatchedEmail(updatedRecord.user.email, emailMessage);
        } catch (emailError) {
            console.warn("⚠️ Error enviando correo:", emailError);
        }
    }

    return NextResponse.json({ 
        success: true, 
        message: "Actualizado correctamente",
        data: updatedRecord 
    });

  } catch (error: any) {
    console.error("🔥 Error:", error);
    return NextResponse.json({ message: error.message || "Error interno" }, { status: 500 });
  }
}