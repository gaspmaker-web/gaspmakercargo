import { NextResponse } from "next/server";

// 👇 VACUNA 1: Optimización Serverless
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 👇 VACUNA 2: Lazy Loading
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;
    const { customAlphabet } = await import("nanoid");
    
    // 🔥 CORRECCIÓN 1: Importamos 'getT' para las traducciones
    const { 
        sendConsolidationRequestEmail, 
        sendAdminConsolidationAlert, 
        sendNotification,
        getT 
    } = await import("@/lib/notifications");

    // Inicializamos nanoid
    const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: "No autorizado." }, { status: 401 });
    
    // 1. Obtener datos del Body
    const body = await req.json();
    const { 
        packageIds, 
        finalWeight, 
        finalDimensions, 
        finalValue, 
        userId: targetUserId 
    } = body;

    // 2. Lógica de Usuario vs Admin
    const userRole = session.user.role;
    const isAdmin = userRole === 'ADMIN' || userRole === 'WAREHOUSE';
    const userId = (isAdmin && targetUserId) ? targetUserId : session.user.id;

    if (!packageIds || packageIds.length === 0) {
      return NextResponse.json({ message: "Selecciona al menos un paquete." }, { status: 400 });
    }

    if (packageIds.length > 7) {
        return NextResponse.json({ message: "Máximo 7 paquetes por envío." }, { status: 400 });
    }

    // 🏢 Tenant filter
    const { getTenant } = await import('@/lib/tenant');
    const tenant = await getTenant(); 

    // --- TRANSACCIÓN ---
    const transactionResult = await prisma.$transaction(async (tx) => {
      
      const validPackages = await tx.package.findMany({
      where: {
  id: { in: packageIds },
  userId: userId,
  status: isAdmin ? undefined : "RECIBIDO_MIAMI",
  tenant_id: tenant?.id || undefined,
},
        select: { id: true, weightLbs: true, description: true, gmcTrackingNumber: true }
      });

      if (validPackages.length !== packageIds.length) {
        throw new Error("Algunos paquetes no están disponibles.");
      }

      if (packageIds.length > 1) {
          const overweightPackage = validPackages.find(p => (p.weightLbs || 0) > 50);
          if (overweightPackage) {
              throw new Error(`El paquete "${overweightPackage.description}" pesa ${overweightPackage.weightLbs} Lbs. Al ser carga pesada, debe enviarse individualmente.`);
          }
      }

      // Crear envío maestro
      const user = await tx.user.findUnique({ 
          where: { id: userId }, 
          // 🔥 CORRECCIÓN 2: Intentamos traer campos que puedan indicar idioma (si existen en tu schema)
          select: { countryCode: true, name: true, email: true } 
      });
      
      const countryCode = user?.countryCode || 'GMC';
      const masterTracking = `M-${countryCode}-${nanoid()}`;

      const initialStatus = (isAdmin && finalWeight) ? "EN_ALMACEN" : "SOLICITUD_CONSOLIDACION";

      const newConsolidatedShipment = await tx.consolidatedShipment.create({
        data: {
  gmcShipmentNumber: masterTracking,
  status: initialStatus,
  destinationCountryCode: countryCode,
  userId: userId,
  weightLbs: finalWeight ? parseFloat(finalWeight) : undefined,
  lengthIn: finalDimensions?.length ? parseFloat(finalDimensions.length) : undefined,
  widthIn: finalDimensions?.width ? parseFloat(finalDimensions.width) : undefined,
  heightIn: finalDimensions?.height ? parseFloat(finalDimensions.height) : undefined,
  declaredValue: finalValue ? parseFloat(finalValue) : 0,
  tenant_id: tenant?.id || null,  // ← AÑADIR
},
      });

      await tx.package.updateMany({
        where: { id: { in: packageIds } },
        data: {
          status: (isAdmin && finalWeight) ? "CONSOLIDADO" : "EN_PROCESO_CONSOLIDACION",
          consolidatedShipmentId: newConsolidatedShipment.id,
        },
      });

      // Retornamos datos
      return { shipment: newConsolidatedShipment, userData: user };
    });

    const { shipment, userData } = transactionResult;

    // ============================================================
    // 📧 NOTIFICACIONES (CORREGIDO Y MULTILINGÜE)
    // ============================================================
    if (shipment.status === "SOLICITUD_CONSOLIDACION" && userData?.email) {
        
        // 🔥 CORRECCIÓN 3: Detección de idioma y uso de diccionario
        const userLang = (userData as any).language || 'en'; // Fallback a Inglés
        const t = getT(userLang);

        // 1. Email al Cliente (Ahora pasa el idioma userLang)
        await sendConsolidationRequestEmail(
            userData.email, 
            userData.name || 'Cliente', 
            packageIds.length, 
            shipment.gmcShipmentNumber,
            userLang // 👈 Vital para que el email salga en Inglés/Español correcto
        );

        // 2. Alerta al Admin (Siempre llega en el idioma por defecto del admin o ES/EN)
        await sendAdminConsolidationAlert(
            userData.name || 'Cliente Desconocido', 
            packageIds.length, 
            shipment.gmcShipmentNumber
        );

        // 3. Notificación en Dashboard (Usando diccionario 't')
        await sendNotification({
            userId: userId,
            title: t.consolidationTitle, // Ej: "Consolidation Request Received"
            message: `${t.consolidationBody} (${packageIds.length} pkgs)`, // Ej: "We have received..."
            type: "INFO"
        });
    }

    return NextResponse.json({
        success: true,
        message: "Procesado correctamente.",
        masterTracking: shipment.gmcShipmentNumber
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error en consolidación:", error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}