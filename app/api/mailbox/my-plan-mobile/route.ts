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
      where: { userId: user.id, status: { in: ['ACTIVE', 'active', 'PENDING_USPS', 'REJECTED'] } },
      select: { planType: true, status: true, uspsForm1583Url: true, primaryIdUrl: true, secondaryIdUrl: true, rejectionReason: true, user: { select: { suiteNo: true } }, additionalRecipients: { select: { id: true, fullName: true, status: true } } }
    });
    const hasPrimaryDocs = !!(sub?.uspsForm1583Url && sub?.primaryIdUrl && sub?.secondaryIdUrl);
    const additionalRecipients = sub?.additionalRecipients ?? [];
    const additionalPeopleCount = additionalRecipients.length;
    const isCorrectionMode = sub?.status === 'REJECTED';
    const isActive = sub?.status === 'ACTIVE' || sub?.status === 'active';
    return NextResponse.json({ 
      success: true, 
      plan: sub?.planType ?? null, 
      status: sub?.status ?? null,
      hasPrimaryDocs,
      isCorrectionMode,
      isActive,
      suiteNo: sub?.user?.suiteNo ?? null,
      rejectionReason: sub?.rejectionReason ?? null,
      additionalPeopleCount,
      additionalRecipients
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
