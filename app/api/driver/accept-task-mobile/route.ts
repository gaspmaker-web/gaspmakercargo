import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { sendNotification } from '@/lib/notifications';

async function getDriverFromToken(req: Request) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'secret');
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as any;
  } catch { return null; }
}

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const driver = await getDriverFromToken(req);
    if (!driver) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { taskId } = await req.json();
    const driverId = driver.id;
    const driverName = driver.name || 'Tu Chofer';

    const updateResult = await prisma.pickupRequest.updateMany({
      where: { id: taskId, driverId: null },
      data: { driverId, status: 'ACEPTADO' }
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ error: 'Esta tarea ya fue tomada por otro conductor.' }, { status: 409 });
    }

    const task = await prisma.pickupRequest.findUnique({
      where: { id: taskId },
      select: { userId: true }
    });

    if (task?.userId) {
      await sendNotification({
        userId: task.userId,
        title: '¡Chofer Asignado!',
        message: `${driverName} ha aceptado tu solicitud y está en camino.`,
        href: '/dashboard-cliente/historial-solicitudes',
        type: 'SUCCESS'
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al aceptar tarea:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
