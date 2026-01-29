import { NextResponse } from "next/server";

// 👇 VACUNA 1: Forzar modo dinámico (Para que Vercel no lo ejecute en Build)
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 👇 VACUNA 2: Imports dentro de la función (Lazy Loading)
    const prisma = (await import("@/lib/prisma")).default;
    const { auth } = await import("@/auth");

    const session = await auth();

    // 🛡️ CORRECCIÓN DE SEGURIDAD (Igual que en accept-task):
    // 1. Usamos (session?.user as any) para leer el rol sin errores de TypeScript.
    // 2. Convertimos a String, Mayúsculas y Trim (Eliminar espacios invisibles).
    const rawRole = (session?.user as any)?.role;
    const userRole = String(rawRole || '').toUpperCase().trim();

    // Validamos que tenga sesión y que sea DRIVER (robusto)
    if (!session?.user?.id || userRole !== 'DRIVER') {
        console.error(`🚫 Process Error: Acceso denegado. Rol detectado: '${userRole}'`);
        return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { requestId, action, photoUrl } = await req.json();

    // 1. Buscamos la solicitud para saber qué tipo de servicio es
    const request = await prisma.pickupRequest.findUnique({
        where: { id: requestId }
    });

    if (!request) {
        return NextResponse.json({ message: "Solicitud no encontrada" }, { status: 404 });
    }

    if (!action) {
        return NextResponse.json({ message: "Falta la acción" }, { status: 400 });
    }

    // 2. Validaciones Dinámicas
    // - PICKUP: Siempre requiere foto.
    // - DELIVERY: Requiere foto SOLO si es 'DELIVERY' (Local). Si es SHIPPING/STORAGE, no.
    if (action === 'PICKUP' && !photoUrl) {
        return NextResponse.json({ message: "La foto de recogida es obligatoria." }, { status: 400 });
    }
    
    if (action === 'DELIVERY' && request.serviceType === 'DELIVERY' && !photoUrl) {
        return NextResponse.json({ message: "La foto de entrega es obligatoria para Delivery Local." }, { status: 400 });
    }

    let updateData = {};

    if (action === 'PICKUP') {
        updateData = {
            photoPickupUrl: photoUrl,
            status: 'EN_CAMINO',
            updatedAt: new Date()
        };
    } else if (action === 'DELIVERY') {
        updateData = {
            // Si es local, guardamos la foto. Si es almacén, queda null o lo que venga (si decides mandar algo)
            photoDeliveryUrl: request.serviceType === 'DELIVERY' ? photoUrl : null,
            status: 'COMPLETADO',
            updatedAt: new Date()
        };
    }

    // 3. Actualizar en Base de Datos
    const updatedRequest = await prisma.pickupRequest.update({
        where: { id: requestId },
        data: updateData
    });

    return NextResponse.json({ success: true, data: updatedRequest });

  } catch (error) {
    console.error("Error driver process:", error);
    return NextResponse.json({ message: "Error procesando la solicitud" }, { status: 500 });
  }
}