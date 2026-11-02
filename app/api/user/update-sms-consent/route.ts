import { getMobileUser } from '@/lib/getMobileUser';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { auth } = await import('@/auth');
        const session = await auth();
        const mobileUser = await getMobileUser(req);
        const userId = session?.user?.id || mobileUser?.id;
        if (!userId) {
            return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
        }

    const { smsConsent } = await req.json();

    await prisma.user.update({
      where: { id: userId },
      data: { smsConsent: Boolean(smsConsent) }
    });

    return NextResponse.json({ success: true, smsConsent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
