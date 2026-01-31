import { NextResponse } from "next/server";

// 👇 VACUNA 1: Forzar modo dinámico (Para evitar errores en Build)
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 👇 VACUNA 2: Imports dentro de la función (Lazy Loading)
    const prisma = (await import("@/lib/prisma")).default;
    const { auth } = await import("@/auth");
    // Importamos la notificación solo si realmente vamos a despachar
    const { sendPackageDispatchedEmail } = await import("@/lib/notifications");

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    // 🔥 MODIFICACIÓN: Ahora aceptamos 'staffName' para entregas en tienda
    const { packageId, finalTrackingNumber, type, staffName } = body;

    // VALIDACIÓN INTELIGENTE:
    // Requiere ID y (Tracking O Nombre del Staff)
    if (!packageId || (!finalTrackingNumber && !staffName)) {
        return NextResponse.json({ message: "Faltan datos (Tracking o Nombre del Staff)" }, { status: 400 });
    }

    // Detectamos si es una Entrega en Tienda o un Envío Courier
    const isStorePickup = !!staffName;
    const newStatus = isStorePickup ? 'ENTREGADO' : 'ENVIADO';

    // Usamos 'any' para evitar conflictos de tipos entre Paquete y Consolidación
    let updatedRecord: any;
    let shipmentId;

    // 👇 LÓGICA DE BIFURCACIÓN (Switch)
    
    if (type === 'CONSOLIDATION') {
        // OPCIÓN A: ES UNA CONSOLIDACIÓN
        console.log(`🚚 Procesando Consolidación (${newStatus}):`, packageId);
        
        updatedRecord = await prisma.consolidatedShipment.update({
            where: { id: packageId },
            data: {
                status: newStatus,
                // Si es Tienda, guardamos el nombre del staff en 'courierService' o similar para registro
                // Si es Envío, guardamos el Tracking
                ...(isStorePickup 
                    ? { courierService: `Entregado en Tienda por: ${staffName}`, finalTrackingNumber: 'RETIRADO_EN_TIENDA' } 
                    : { finalTrackingNumber: finalTrackingNumber }
                ),
                updatedAt: new Date()
            },
            include: { user: true } // Vital para el correo
        });

        // También actualizamos los paquetes hijos
        await prisma.package.updateMany({
            where: { consolidatedShipmentId: packageId },
            data: { status: newStatus, updatedAt: new Date() }
        });

        shipmentId = updatedRecord.gmcShipmentNumber;

    } else {
        // OPCIÓN B: ES UN PAQUETE INDIVIDUAL
        console.log(`📦 Procesando Paquete Individual (${newStatus}):`, packageId);

        updatedRecord = await prisma.package.update({
            where: { id: packageId },
            data: {
                status: newStatus,
                // Si es Tienda, usamos 'deliverySignature' para guardar el nombre del staff (Record de control)
                ...(isStorePickup 
                    ? { deliverySignature: `Staff: ${staffName}`, gmcTrackingNumber: 'RETIRADO_EN_TIENDA' } 
                    : { gmcTrackingNumber: finalTrackingNumber }
                ),
                updatedAt: new Date()
            },
            include: { user: true } // Vital para el correo
        });

        shipmentId = updatedRecord.gmcTrackingNumber;
    }

    // ENVIAR NOTIFICACIÓN AL CLIENTE
    if (updatedRecord && updatedRecord.user) {
        try {
            // Preparar variables para el mensaje
            const clientName = updatedRecord.user.name || 'Cliente';
            const refId = shipmentId || 'Envío';

            let emailMessage = "";

            if (isStorePickup) {
                // MENSAJE DE ENTREGA EN TIENDA
                emailMessage = `Hola ${clientName}, tu envío (${refId}) ha sido entregado exitosamente en nuestra tienda. Atendido por: ${staffName}. Gracias por usar Gasp Maker.`;
            } else {
                // MENSAJE DE DESPACHO (COURIER)
                const courierName = updatedRecord.selectedCourier || 'Transportista';
                const tracking = finalTrackingNumber;
                emailMessage = `Hola ${clientName}, tu envío (${refId}) ha sido despachado exitosamente vía ${courierName}. Tu número de rastreo es: ${tracking}. Gracias por usar Gasp Maker.`;
            }

            await sendPackageDispatchedEmail(
                updatedRecord.user.email,
                emailMessage // Pasamos TEXTO, no un objeto
            );
        } catch (emailError) {
            console.warn("⚠️ Correo de notificación falló, pero el registro se guardó:", emailError);
        }
    }

    return NextResponse.json({ 
        success: true, 
        message: isStorePickup ? "Entregado en tienda correctamente" : "Despachado correctamente",
        data: updatedRecord 
    });

  } catch (error: any) {
    console.error("🔥 Error processing:", error);
    // P2025 es el código de "Record not found" de Prisma
    if (error.code === 'P2025') {
        return NextResponse.json({ message: "No se encontró el envío (ID incorrecto)" }, { status: 404 });
    }
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}