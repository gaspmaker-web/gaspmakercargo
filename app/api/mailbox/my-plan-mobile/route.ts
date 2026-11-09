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
    const sub = await prisma.mailboxSubscription.findFirst({
      where: { userId: user.id, status: { in: ['ACTIVE', 'active', 'PENDING_USPS'] } },
      select: { planType: true, status: true, uspsForm1583Url: true, primaryIdUrl: true, secondaryIdUrl: true, rejectionReason: true }
    });
    const hasPrimaryDocs = !!(sub?.uspsForm1583Url && sub?.primaryIdUrl && sub?.secondaryIdUrl);
    const isCorrectionMode = sub?.status === 'REJECTED';
    return NextResponse.json({ 
      success: true, 
      plan: sub?.planType ?? null, 
      status: sub?.status ?? null,
      hasPrimaryDocs,
      isCorrectionMode,
      rejectionReason: sub?.rejectionReason ?? null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
