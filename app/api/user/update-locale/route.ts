import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { locale } = await req.json();
    const validLocales = ['en', 'es', 'pt', 'fr'];
    if (!validLocales.includes(locale)) {
      return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { preferredLocale: locale }
    });

    return NextResponse.json({ success: true, locale });
  } catch (error: any) {
    console.error('Error updating locale:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
