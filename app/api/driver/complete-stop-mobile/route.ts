import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';

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

export async function POST(req: Request) {
  const driver = await getDriverFromToken(req);
  if (!driver) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { packageId, stopIndex, photoUrl, photoUrls, recipientName } = await req.json();
  if (!packageId || stopIndex === undefined || !photoUrl) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
  }

  const task = await prisma.pickupRequest.findUnique({ where: { id: packageId } });
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });
const stops = Array.isArray(task.extraStops) ? [...(task.extraStops as any[])] : [];
if (stops[stopIndex]) {
  stops[stopIndex] = {
    ...stops[stopIndex],
    photoUrl: photoUrl,
    photoUrls: photoUrls || [],   // ← guardar array
    recipientName: recipientName || null,
  };
}

  await prisma.pickupRequest.update({
    where: { id: packageId },
    data: { extraStops: stops },
  });

  return NextResponse.json({ success: true });
}
