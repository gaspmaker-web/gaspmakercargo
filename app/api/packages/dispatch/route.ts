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
    const { packageId, finalTrackingNumber, type } = body;

    if (!packageId || !finalTrackingNumber) {
      return NextResponse.json({ message: "Faltan datos" }, { status: 400 });
    }

    // Usamos 'any' para evitar conflictos de tipos entre Paquete y Consolidación
    let updatedRecord: any;
    let shipmentId;

    // 👇 LÓGICA DE BIFURCACIÓN (Switch)
    if (type === 'CONSOLIDATION') {
      // OPCIÓN A: ES UNA CONSOLIDACIÓN
      console.log("🚚 Despachando Consolidación:", packageId);
      
      updatedRecord = await prisma.consolidatedShipment.update({
        where: { id: packageId },
        data: {
          status: 'ENVIADO',
          finalTrackingNumber: finalTrackingNumber,
          updatedAt: new Date()
        },
        include: { user: true } // Vital para el correo
      });

      // También actualizamos los paquetes hijos para que se marquen como enviados
      await prisma.package.updateMany({
        where: { consolidatedShipmentId: packageId },
        data: { status: 'ENVIADO', updatedAt: new Date() }
      });

      shipmentId = updatedRecord.gmcShipmentNumber;

    } else {
      // OPCIÓN B: ES UN PAQUETE INDIVIDUAL (Comportamiento original)
      console.log("📦 Despachando Paquete Individual:", packageId);

      updatedRecord = await prisma.package.update({
        where: { id: packageId },
        data: {
          status: 'ENVIADO',
          gmcTrackingNumber: finalTrackingNumber, // O finalTrackingNumber si usas ese campo
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
        const courierName = updatedRecord.selectedCourier || 'Transportista';
        const tracking = finalTrackingNumber;
        const refId = shipmentId || 'Envío';

        // 🚨 SOLUCIÓN: Creamos un mensaje de texto (String)
        // Esto corrige el error "Argument of type object is not assignable to parameter of type string"
        const emailMessage = `Hola ${clientName}, tu envío (${refId}) ha sido despachado exitosamente vía ${courierName}. Tu número de rastreo es: ${tracking}. Gracias por usar Gasp Maker.`;

        await sendPackageDispatchedEmail(
          updatedRecord.user.email,
          emailMessage // Pasamos TEXTO, no un objeto
        );
      } catch (emailError) {
        console.warn("⚠️ Correo de despacho falló, pero el registro se guardó:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Despachado correctamente",
      data: updatedRecord
    });

  } catch (error: any) {
    console.error("🔥 Error dispatching:", error);
    
    // P2025 es el código de "Record not found" de Prisma
    if (error.code === 'P2025') {
      return NextResponse.json({ message: "No se encontró el envío (ID incorrecto)" }, { status: 404 });
    }
    
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}