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
    const { packageId, pin } = await req.json();
    if (!packageId || !pin) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    const pickup = await prisma.pickupRequest.findUnique({ where: { id: packageId }, select: { pickupPin: true } });
    if (!pickup) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (pickup.pickupPin && pickup.pickupPin !== pin) return NextResponse.json({ error: 'Incorrect PIN' }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('verify-pin error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
