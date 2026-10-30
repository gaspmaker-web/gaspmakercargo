import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

async function getUserFromToken(req: Request) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'secret');
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as any;
  } catch { return null; }
}

export async function GET(req: Request) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, suiteNo: true, walletBalance: true, image: true, countryCode: true, phone: true }
    });
    if (!dbUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    const packages = await prisma.package.findMany({
      where: { userId: user.id, consolidatedShipmentId: null },
      orderBy: { createdAt: 'desc' }, take: 20,
      select: { id: true, gmcTrackingNumber: true, status: true, description: true, weightLbs: true, createdAt: true, courier: true }
    });

    const shipments = await prisma.consolidatedShipment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }, take: 10,
      select: { id: true, gmcShipmentNumber: true, status: true, selectedCourier: true, finalTrackingNumber: true, createdAt: true, totalAmount: true, packages: { select: { id: true } } }
    });

    const pickups = await prisma.pickupRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }, take: 10,
      select: { id: true, status: true, originAddress: true, dropOffAddress: true, pickupDate: true, totalPaid: true }
    });

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id, isRead: false },
      orderBy: { createdAt: 'desc' }, take: 5,
      select: { id: true, title: true, message: true, createdAt: true, type: true }
    });

    return NextResponse.json({
      user: dbUser,
      packages,
      shipments: shipments.map(s => ({ ...s, packagesCount: s.packages.length })),
      pickups,
      notifications,
      summary: {
        packagesInMiami: packages.filter(p => ['RECIBIDO','EN_BODEGA','DISPONIBLE'].includes(p.status)).length,
        inTransit: shipments.filter(s => ['EN_CAMINO','EN_REPARTO','EN_RUTA'].includes(s.status)).length,
        pendingPickups: pickups.filter(p => ['PENDIENTE','PAGADO','ACEPTADO'].includes(p.status)).length,
        unreadNotifications: notifications.length,
      }
    });
  } catch (err) {
    console.error('[client/dashboard]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
