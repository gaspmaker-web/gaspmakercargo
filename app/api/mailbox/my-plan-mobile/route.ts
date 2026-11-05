import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

async function getUserFromToken(req: Request) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'secret');
  try { const { payload } = await jwtVerify(token, secret); return payload as any; }
  catch { return null; }
}

export async function GET(req: Request) {
  try {
    const user = await getUserFromToken(req);
    if (!user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const sub = await prisma.mailboxSubscription.findFirst({ where: { userId: user.id, status: 'ACTIVE' }, select: { planType: true, status: true } });
    return NextResponse.json({ success: true, plan: sub?.planType ?? null, status: sub?.status ?? null });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
