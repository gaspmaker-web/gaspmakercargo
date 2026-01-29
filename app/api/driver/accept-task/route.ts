import { NextResponse } from "next/server";

// 👇 VACUNA 1: Forzar modo dinámico (Para que no se ejecute en el Build)
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 👇 VACUNA 2: Lazy Loading (Carga perezosa de librerías)
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;
    // Importamos la notificación solo cuando se necesita
    const { sendNotification } = await import("@/lib/notifications");

    const session = await auth();
    
    // 🛡️ CORRECCIÓN DE SEGURIDAD:
    // 1. Usamos (session?.user as any) para leer el rol sin que TypeScript se queje.
    // 2. Usamos .toUpperCase() para que acepte "Driver", "driver" o "DRIVER".
    const userRole = (session?.user as any)?.role?.toUpperCase();

    // 1. SEGURIDAD: Solo Choferes pueden aceptar tareas
    if (!session || userRole !== 'DRIVER') {
        console.error("🚫 Bloqueo de Seguridad: Usuario intentó aceptar tarea sin ser DRIVER. Rol detectado:", userRole);
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { taskId } = await req.json();
    const driverId = session.user.id;
    const driverName = session.user.name || "Tu Chofer";

    // 2. ASIGNACIÓN ATÓMICA (RACE CONDITION CHECK)
    // Intentamos actualizar SOLO si driverId sigue siendo NULL.
    // Esto evita que dos choferes tomen la misma tarea al mismo tiempo.
    const updateResult = await prisma.pickupRequest.updateMany({
        where: { 
            id: taskId,
            driverId: null // 🔒 EL CANDADO DE SEGURIDAD
        },
        data: {
            driverId: driverId,
            status: 'ACEPTADO' // Cambiamos estado para que el chofer sepa que es suya
        }
    });

    // Si count es 0, significa que alguien más la ganó hace un segundo
    if (updateResult.count === 0) {
        return NextResponse.json({ error: "Esta tarea ya fue tomada por otro conductor." }, { status: 409 });
    }

    // 3. RECUPERAR DATOS PARA NOTIFICAR
    // Necesitamos saber quién es el cliente dueño de la carga
    const task = await prisma.pickupRequest.findUnique({
        where: { id: taskId },
        select: { userId: true }
    });

    // 4. 🔔 NOTIFICAR AL CLIENTE
    if (task && task.userId) {
        await sendNotification({
            userId: task.userId,
            title: "¡Chofer Asignado!",
            message: `${driverName} ha aceptado tu solicitud y está en camino.`,
            href: "/dashboard-cliente/historial-solicitudes", // Link para que vea el mapa
            type: "SUCCESS"
        });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error al aceptar tarea:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}