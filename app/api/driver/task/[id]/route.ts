import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { jwtVerify } from 'jose';

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

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const driver = await getDriverFromToken(req);
  if (!driver) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const task = await prisma.pickupRequest.findUnique({
    where: { id: params.id },
    include: { user: { select: { name: true, phone: true } } }
  });

  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(task);
}
