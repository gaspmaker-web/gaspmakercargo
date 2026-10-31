import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const admin = await verifyAdminToken(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const rows = await prisma.lockerConfig.findMany();
    const config: Record<string, string> = {};
    for (const row of rows) config[row.key] = row.value;
    return NextResponse.json({ success: true, config });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdminToken(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { config } = await req.json() as { config: Record<string, string> };
    if (!config || typeof config !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    await Promise.all(
      Object.entries(config).map(([key, value]) =>
        prisma.lockerConfig.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      )
    );
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
