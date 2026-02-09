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
    const { packageId, finalTrackingNumber, type, courierName } = body; // Agregamos courierName si viene del front

    if (!packageId || !finalTrackingNumber) {
      return NextResponse.json({ message: "Faltan datos (ID o Tracking Final)" }, { status: 400 });
    }

    // Usamos 'any' para facilitar el acceso a propiedades comunes
    let updatedRecord: any;
    let shipmentId: string = "";
    let finalCourier: string = courierName || "Transportista Externo";

    // 👇 LÓGICA DE BIFURCACIÓN (Switch)
    if (type === 'CONSOLIDATION') {
      // OPCIÓN A: ES UNA CONSOLIDACIÓN
      console.log("🚚 Despachando Consolidación:", packageId);
      
      updatedRecord = await prisma.consolidatedShipment.update({
        where: { id: packageId },
        data: {
          status: 'ENVIADO',
          finalTrackingNumber: finalTrackingNumber,
          // Si el admin seleccionó courier en el despacho, podrías actualizarlo aquí también
          updatedAt: new Date()
        },
        include: { user: true } // Vital para el correo
      });

      // Actualizamos paquetes hijos
      await prisma.package.updateMany({
        where: { consolidatedShipmentId: packageId },
        data: { status: 'ENVIADO', updatedAt: new Date() }
      });

      shipmentId = updatedRecord.gmcShipmentNumber;
      // Intentamos obtener el courier guardado, o usamos el fallback
      finalCourier = updatedRecord.selectedCourier || updatedRecord.courierService || finalCourier;

    } else {
      // OPCIÓN B: ES UN PAQUETE INDIVIDUAL
      console.log("📦 Despachando Paquete Individual:", packageId);

      updatedRecord = await prisma.package.update({
        where: { id: packageId },
        data: {
          status: 'ENVIADO',
          gmcTrackingNumber: finalTrackingNumber, // Guardamos el tracking final
          updatedAt: new Date()
        },
        include: { user: true } // Vital para el correo
      });

      shipmentId = updatedRecord.gmcTrackingNumber;
      // En paquetes individuales, a veces no hay courier seleccionado previamente
      finalCourier = updatedRecord.carrierTrackingNumber ? "Courier Original" : finalCourier;
    }

    // =========================================================================
    // 🔔 NOTIFICACIONES AL CLIENTE (MULTILINGÜE 🌍)
    // =========================================================================
    
    if (updatedRecord && updatedRecord.user && updatedRecord.user.email) {
      try {
        // 1. Detectar idioma del usuario (Fallback: Inglés)
        // Usamos 'any' porque Prisma puede no tener tipado estricto en el campo language si es nuevo
        const userLang = (updatedRecord.user as any).language || 'en';
        const t = getT(userLang);

        console.log(`📧 Enviando notificación de despacho a ${updatedRecord.user.email} (${userLang})...`);

        // 2. Enviar Email con Plantilla HTML (Tu Carga va en Camino)
        await sendShipmentDispatchedEmail(
          updatedRecord.user.email,
          updatedRecord.user.name || 'Cliente',
          shipmentId,        // ID Interno
          finalCourier,      // Courier
          finalTrackingNumber, // Tracking Real
          userLang           // 👈 Pasamos el idioma para que el email salga traducido
        );

        // 3. Enviar Notificación a la Campana (Dashboard)
        // Construimos el mensaje usando el diccionario traducido
        const dashMessage = `${t.dispatchedBody} (${t.tracking}: ${finalTrackingNumber})`;

        await sendNotification({
            userId: updatedRecord.userId,
            title: t.dispatchedTitle, // Ej: "Package Dispatched!"
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