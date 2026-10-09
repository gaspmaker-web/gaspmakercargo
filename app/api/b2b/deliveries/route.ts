import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'B2B_STORE') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pickups = await prisma.pickupRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      dropOffAddress: true,
      description: true,
      createdAt: true,
      totalPaid: true,
      status: true,
      extraStops: true,
      photoPickupUrl: true,
      pickupPin: true,
    },
  });

  return NextResponse.json(pickups);
}