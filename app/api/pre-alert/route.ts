// recogida-de-paquetes-miami/app/api/pre-alert/route.ts
// Replace the full file with this content

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

function generateLockerNumber(prefix: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

async function getUser(req: NextRequest) {
  // Mobile: Bearer JWT
  const auth_header = req.headers.get('authorization') ?? '';
  if (auth_header.startsWith('Bearer ')) {
    const token = auth_header.slice(7);
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET ?? '');
      const { payload } = await jwtVerify(token, secret);
      const userId = ((payload as any).userId ?? (payload as any).id) as string;
      if (!userId) return null;
      return prisma.user.findUnique({ where: { id: userId } });
    } catch { return null; }
  }
  // Web: NextAuth session
  const session = await auth();
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({ where: { email: session.user.email } });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json() as { trackingNumber: string; carrier?: string; description: string; value?: string; invoiceUrl?: string };
    const { trackingNumber, carrier, description, value, invoiceUrl } = body;

    if (!trackingNumber || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const pkg = await prisma.package.create({
      data: {
        userId: user.id,
        status: 'PRE_ALERTA',
        carrierTrackingNumber: (trackingNumber as string).toUpperCase(),
        gmcTrackingNumber: generateLockerNumber('PRE'),
        description: description as string,
        courier: (carrier as string) ?? 'OTHER',
        declaredValue: parseFloat(value ?? '0') || 0,
        invoiceUrl: invoiceUrl ?? null,
        weightLbs: 0,
        lengthIn: 0,
        widthIn: 0,
        heightIn: 0,
      },
    });

    return NextResponse.json({ success: true, id: pkg.id, gmcTrackingNumber: pkg.gmcTrackingNumber });
  } catch (err: unknown) {
    // Duplicate tracking number
    if ((err as { code?: string })?.code === 'P2002') {
      return NextResponse.json({ error: 'Tracking number already exists' }, { status: 409 });
    }
    console.error('[pre-alert]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

