import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await prisma.mailboxSubscription.findUnique({
      where: { userId: session.user.id },
      select: { planType: true }
    });

    if (!subscription) {
      return NextResponse.json({ success: false, plan: null });
    }

    return NextResponse.json({ success: true, plan: subscription.planType });
  } catch (error) {
    console.error("Error fetching plan:", error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}