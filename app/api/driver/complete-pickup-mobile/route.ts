import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export const dynamic = 'force-dynamic';

async function getDriverFromToken(req: Request) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'secret');
  try { const { payload } = await jwtVerify(token, secret); return payload as any; }
  catch { return null; }
}

export async function POST(req: Request) {
  try {
    const driver = await getDriverFromToken(req);
    if (!driver) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const prisma = (await import("@/lib/prisma")).default;
    const body = await req.json();
    const pickupId = body.packageId || body.pickupId;
    const photoUrl = body.photoPickupUrl || body.photoUrl;

    if (!pickupId || !photoUrl) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    const task = await prisma.pickupRequest.update({
      where: { id: pickupId },
      data: { status: 'EN_REPARTO', photoPickupUrl: photoUrl, updatedAt: new Date() },
      include: { user: true }
    });

    try {
      const { sendNotification } = await import("@/lib/notifications");
      await sendNotification({ userId: task.userId, title: "📦 Paquete Recogido", message: "El chofer ya tiene tu envío y va en camino.", href: "/dashboard-cliente/historial-solicitudes", type: "INFO" });
    } catch {}

    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    console.error("complete-pickup-mobile error:", error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
