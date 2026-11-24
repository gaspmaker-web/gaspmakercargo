import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { language } = await req.json();
  if (!['en','es','pt','fr'].includes(language)) return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
  await prisma.user.update({ where: { id: session.user.id }, data: { preferredLocale: language } });
  return NextResponse.json({ ok: true });
}