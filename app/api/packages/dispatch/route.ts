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
    // 🔥 ACEPTAMOS 'staffName' (Para entregas en tienda)
    const { packageId, finalTrackingNumber, type, staffName } = body;

    // VALIDACIÓN: Debe haber ID y (Tracking O StaffName)
    if (!packageId || (!finalTrackingNumber && !staffName)) {
        return NextResponse.json({ message: "Faltan datos (Tracking o Nombre Staff)" }, { status: 400 });
    }

    // Detectamos si es Retiro en Tienda o Envío
    const isStorePickup = !!staffName;
    const newStatus = isStorePickup ? 'ENTREGADO' : 'ENVIADO'; // 👈 AQUÍ CAMBIA EL ESTADO

    let updatedRecord: any;
    let shipmentId;

    // 👇 LÓGICA DE BIFURCACIÓN
    
    if (type === 'CONSOLIDATION') {
        // ES CONSOLIDACIÓN
        console.log(`🚚 Procesando Consolidación (${newStatus}):`, packageId);
        
        updatedRecord = await prisma.consolidatedShipment.update({
            where: { id: packageId },
            data: {
                status: newStatus,
                // Si es tienda, guardamos quien entregó. Si es courier, el tracking.
                ...(isStorePickup 
                    ? { courierService: `Entregado en Tienda por: ${staffName}`, finalTrackingNumber: 'RETIRADO_EN_TIENDA' } 
                    : { finalTrackingNumber: finalTrackingNumber }
                ),
                updatedAt: new Date()
            },
            include: { user: true }
        });

        // Actualizamos hijos
        await prisma.package.updateMany({
            where: { consolidatedShipmentId: packageId },
            data: { status: newStatus, updatedAt: new Date() }
        });

        shipmentId = updatedRecord.gmcShipmentNumber;

    } else {
        // ES PAQUETE INDIVIDUAL
        console.log(`📦 Procesando Paquete Individual (${newStatus}):`, packageId);

        updatedRecord = await prisma.package.update({
            where: { id: packageId },
            data: {
                status: newStatus,
                ...(isStorePickup 
                    ? { deliverySignature: `Staff: ${staffName}`, gmcTrackingNumber: 'RETIRADO_EN_TIENDA' } 
                    : { gmcTrackingNumber: finalTrackingNumber }
                ),
                updatedAt: new Date()
            },
            include: { user: true }
        });

        shipmentId = updatedRecord.gmcTrackingNumber;
    }

    // ENVIAR CORREO AL CLIENTE
    if (updatedRecord && updatedRecord.user) {
        try {
            const clientName = updatedRecord.user.name || 'Cliente';
            const refId = shipmentId || 'Envío';
            let emailMessage = "";

            if (isStorePickup) {
                // MENSAJE TIENDA
                emailMessage = `Hola ${clientName}, tu envío (${refId}) ha sido entregado exitosamente en nuestra tienda. Atendido por: ${staffName}. Gracias por elegirnos.`;
            } else {
                // MENSAJE COURIER
                const courierName = updatedRecord.selectedCourier || 'Transportista';
                const tracking = finalTrackingNumber;
                emailMessage = `Hola ${clientName}, tu envío (${refId}) ha sido despachado vía ${courierName}. Tracking: ${tracking}.`;
            }

            await sendPackageDispatchedEmail(updatedRecord.user.email, emailMessage);
        } catch (emailError) {
            console.warn("⚠️ Error enviando correo:", emailError);
        }
    }

    return NextResponse.json({ 
        success: true, 
        message: isStorePickup ? "Entregado en Tienda" : "Despachado correctamente",
        data: updatedRecord 
    });

  } catch (error: any) {
    console.error("🔥 Error:", error);
    return NextResponse.json({ message: error.message || "Error interno" }, { status: 500 });
  }
}