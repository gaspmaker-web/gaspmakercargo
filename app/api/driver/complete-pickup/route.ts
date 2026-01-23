import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { sendNotification } from "@/lib/notifications";

export async function POST(req: Request) {
  try {
    const session = await auth();
    // Validar que sea Chofer o Admin
    if (!session || (session.user.role !== 'DRIVER' && session.user.role !== 'ADMIN')) {
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
    // Corrección: Eliminamos 'notifyAdmin: true' porque no existe en la definición de tipos
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