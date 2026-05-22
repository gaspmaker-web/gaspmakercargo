import { NextResponse } from "next/server";

// 👇 VACUNA 1: Forzar modo dinámico (Para evitar errores en Build)
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 👇 VACUNA 2: Imports dentro de la función (Lazy Loading)
    const prisma = (await import("@/lib/prisma")).default;
    const { auth } = await import("@/auth");
    
    // 🔥 IMPORTAMOS LA PLANTILLA HTML, LA CAMPANITA Y EL TRADUCTOR
    const { sendShipmentDispatchedEmail, sendNotification, getT } = await import("@/lib/notifications");

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { packageId, finalTrackingNumber, type, courierName } = body; 

    if (!packageId || !finalTrackingNumber) {
      return NextResponse.json({ message: "Faltan datos (ID o Tracking Final)" }, { status: 400 });
    }

    let updatedRecord: any;
    let shipmentId: string = "";
    let finalCourier: string = courierName || "Transportista Externo";

    // 👇 LÓGICA DE BIFURCACIÓN OPTIMIZADA CON TRANSACCIONES
    if (type === 'CONSOLIDATION') {
      // =========================================================================
      // OPCIÓN A: ES UNA CONSOLIDACIÓN MÁSTER
      // =========================================================================
      console.log("🚚 Despachando Consolidación:", packageId);
      
      // Envolvemos en transacción para asegurar sincronización atómica
      const [resShipment] = await prisma.$transaction([
        prisma.consolidatedShipment.update({
          where: { id: packageId },
          data: {
            status: 'ENVIADO',
            finalTrackingNumber: finalTrackingNumber,
            updatedAt: new Date()
          },
          include: { user: true } 
        }),
        prisma.package.updateMany({
          where: { consolidatedShipmentId: packageId },
          data: { status: 'ENVIADO', updatedAt: new Date() }
        })
      ]);

      updatedRecord = resShipment;
      shipmentId = updatedRecord.gmcShipmentNumber;
      finalCourier = updatedRecord.selectedCourier || updatedRecord.courierService || finalCourier;

    } else {
      // =========================================================================
      // OPCIÓN B: ES UN PAQUETE INDIVIDUAL (¡Aquí estaba la fuga!)
      // =========================================================================
      console.log("📦 Despachando Paquete Individual:", packageId);

      // 1. Buscamos si este paquete pertenece a una Consolidación Padre
      const existingPackage = await prisma.package.findUnique({
        where: { id: packageId },
        select: { consolidatedShipmentId: true }
      });

      if (!existingPackage) {
        return NextResponse.json({ message: "No se encontró el envío (ID incorrecto)" }, { status: 404 });
      }

      // 2. Si tiene un padre asignado, sincronizamos a toda la familia bajo transacción
      if (existingPackage.consolidatedShipmentId) {
        console.log(`🔗 El paquete pertenece a la consolidación: ${existingPackage.consolidatedShipmentId}. Sincronizando grupo...`);
        
        const [_, resPackage] = await prisma.$transaction([
          // Actualizamos la caja máster padre
          prisma.consolidatedShipment.update({
            where: { id: existingPackage.consolidatedShipmentId },
            data: {
              status: 'ENVIADO',
              finalTrackingNumber: finalTrackingNumber, // Hereda el tracking de salida para el rastreo del carrusel
              updatedAt: new Date()
            }
          }),
          // Actualizamos el paquete en cuestión (incluyendo la relación del usuario para las alertas)
          prisma.package.update({
            where: { id: packageId },
            data: {
              status: 'ENVIADO',
              gmcTrackingNumber: finalTrackingNumber, 
              updatedAt: new Date()
            },
            include: { user: true }
          }),
          // Actualizamos a los paquetes hermanos que viajen dentro del mismo contenedor
          prisma.package.updateMany({
            where: { 
              consolidatedShipmentId: existingPackage.consolidatedShipmentId,
              id: { not: packageId }
            },
            data: { status: 'ENVIADO', updatedAt: new Date() }
          })
        ]);

        updatedRecord = resPackage;
      } else {
        // Si el paquete está completamente suelto (sin padre), se procesa de forma individual estándar
        updatedRecord = await prisma.package.update({
          where: { id: packageId },
          data: {
            status: 'ENVIADO',
            gmcTrackingNumber: finalTrackingNumber,
            updatedAt: new Date()
          },
          include: { user: true }
        });
      }

      shipmentId = updatedRecord.gmcTrackingNumber;
      finalCourier = updatedRecord.carrierTrackingNumber ? "Courier Original" : finalCourier;
    }

    // =========================================================================
    // 🔔 NOTIFICACIONES AL CLIENTE (MULTILINGÜE 🌍) - Mantenido Intacto
    // =========================================================================
    if (updatedRecord && updatedRecord.user && updatedRecord.user.email) {
      try {
        const userLang = (updatedRecord.user as any).language || 'en';
        const t = getT(userLang);

        console.log(`📧 Enviando notificación de despacho a ${updatedRecord.user.email} (${userLang})...`);

        await sendShipmentDispatchedEmail(
          updatedRecord.user.email,
          updatedRecord.user.name || 'Cliente',
          shipmentId,        
          finalCourier,      
          finalTrackingNumber, 
          userLang           
        );

        const dashMessage = `${t.dispatchedBody} (${t.tracking}: ${finalTrackingNumber})`;

        await sendNotification({
            userId: updatedRecord.userId,
            title: t.dispatchedTitle, 
            message: dashMessage,
            type: "SUCCESS",
            href: `/dashboard-cliente/rastreo/${shipmentId}`
        });

      } catch (emailError) {
        console.warn("⚠️ Error en notificación, pero el despacho se guardó:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Despachado correctamente",
      data: updatedRecord
    });

  } catch (error: any) {
    console.error("🔥 Error dispatching:", error);
    if (error.code === 'P2025') {
      return NextResponse.json({ message: "No se encontró el envío (ID incorrecto)" }, { status: 404 });
    }
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}