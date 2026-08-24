import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await auth();
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const prisma = (await import('@/lib/prisma')).default;

  const shipment = await prisma.consolidatedShipment.findUnique({
    where: { id },
    include: {
      user: {
        select: { name: true, email: true, phone: true, suiteNo: true }
      },
      packages: {
        select: { id: true, gmcTrackingNumber: true, description: true, weightLbs: true }
      }
    }
  });

  if (!shipment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(shipment);
}