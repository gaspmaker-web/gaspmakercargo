import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;
    const Stripe = (await import("stripe")).default;

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2024-06-20' as any,
    });

    // ── Auth: NextAuth session OR mobile JWT Bearer ──────────────────────────
    const session = await auth();
    let userId = session?.user?.id;

    if (!userId) {
      const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const { jwtVerify } = await import("jose");
        const tk = authHeader.slice(7);
        const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "secret");
        try {
          const { payload } = await jwtVerify(tk, secret);
          userId = (payload as any).id || (payload as any).userId;
        } catch {}
      }
    }

    if (!userId) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ message: "Missing orderId" }, { status: 400 });

    // ── Fetch order and validate ─────────────────────────────────────────────
    const order = await prisma.shopperOrder.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) return NextResponse.json({ message: "Order not found" }, { status: 404 });
    if (order.userId !== userId) return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    if (order.status !== 'QUOTED') return NextResponse.json({ message: "Order is not ready to pay" }, { status: 400 });
    if (!order.totalAmount || order.totalAmount <= 0) return NextResponse.json({ message: "Invalid amount" }, { status: 400 });

    // ── Stripe customer ──────────────────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true, email: true, name: true },
    });

    let customerId = user?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user?.email || undefined,
        name:  user?.name  || undefined,
        metadata: { userId },
      });
      customerId = customer.id;
      await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
    }

    const amountCents = Math.round(order.totalAmount * 100);
    if (amountCents < 50) return NextResponse.json({ message: "Amount too low." }, { status: 400 });

    const ephemeralKeyObj = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2024-06-20' }
    );

    const pi = await stripe.paymentIntents.create({
      amount:      amountCents,
      currency:    'usd',
      customer:    customerId,
      description: `Personal Shopper Order #${orderId.slice(-6).toUpperCase()}`,
      metadata: {
        type:    'SHOPPER_ORDER',
        orderId,
        userId,
        total:   String(order.totalAmount),
      },
    });

    return NextResponse.json({
      clientSecret:    pi.client_secret,
      paymentIntentId: pi.id,
      ephemeralKey:    ephemeralKeyObj.secret,
      customerId,
    });

  } catch (error: any) {
    console.error("❌ checkout-shopper-mobile:", error);
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 });
  }
}