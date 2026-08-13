import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;

    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (adminUser?.role?.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can change plans' }, { status: 403 });
    }

    const { userId, planType, noConsolidationFee } = await req.json();

    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    const validPlans = ['STANDARD', 'VIP_WHOLESALE'];
    if (!validPlans.includes(planType)) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        planType,
        noConsolidationFee: Boolean(noConsolidationFee),
      },
      select: { id: true, name: true, planType: true, noConsolidationFee: true }
    });

    console.log(`✅ Plan updated: ${updatedUser.name} → ${planType} | noFee: ${noConsolidationFee}`);

    return NextResponse.json({ success: true, user: updatedUser });

  } catch (error: any) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}