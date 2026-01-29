import { NextResponse } from "next/server";

// 👇 VACUNA 1: Forzar modo dinámico (Evita ejecución en Build)
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 👇 VACUNA 2: Imports dentro de la función (Lazy Loading)
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;
    const { sendNotification } = await import("@/lib/notifications");

    const session = await auth();

    // 🛡️ CORRECCIÓN DE SEGURIDAD:
    // 1. Usamos (session?.user as any) para leer el rol sin errores de TypeScript.
    // 2. Convertimos a String, Mayúsculas y Trim (Eliminar espacios invisibles).
    const rawRole = (session?.user as any)?.role;
    const userRole = String(rawRole || '').toUpperCase().trim();

    // Validar que sea Chofer o Admin (usando la variable limpia 'userRole')
    if (!session || (userRole !== 'DRIVER' && userRole !== 'ADMIN')) {
        console.error(`🚫 Complete-Pickup: Acceso denegado. Rol detectado: '${userRole}'`);
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    // 🚨 CORRECCIÓN CLAVE: Leemos 'pickupId' (que es lo que manda el frontend) o 'taskId' por si acaso.
    const pickupId = body.pickupId || body.taskId;
    const { photoUrl } = body;

    // Validación estricta para evitar errores silenciosos
    if (!pickupId || !photoUrl) {
        console.error("❌ Faltan datos en complete-pickup:", { pickupId, photoUrl });
        return NextResponse.json({ error: 'Faltan datos (ID o Foto)' }, { status: 400 });
    }

    // 1. ACTUALIZAMOS LA TAREA EN BASE DE DATOS
    const task = await prisma.pickupRequest.update({
        where: { id: pickupId },
        data: {
            status: 'EN_REPARTO', // Cambiamos estado para desbloquear el paso 2
            photoPickupUrl: photoUrl, // Guardamos la foto
            updatedAt: new Date()
        },
        include: { user: true }
    });

    // 2. NOTIFICAMOS AL CLIENTE
    await sendNotification({
        userId: task.userId,
        title: "📦 Paquete Recogido",
        message: "El chofer ya tiene tu envío y va en camino al destino.",
        href: "/dashboard-cliente/historial-solicitudes", // El cliente verá la foto aquí
        type: "INFO"
    });

    console.log("✅ Recogida completada con éxito:", pickupId);
    return NextResponse.json({ success: true, data: task });

  } catch (error) {
    console.error("🔥 Error crítico en complete-pickup:", error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}