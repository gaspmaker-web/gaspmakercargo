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

    // Auth: session o Bearer token
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

    const { packageIds, scheduledDate, scheduledTime } = await req.json();

    if (!packageIds || !Array.isArray(packageIds) || packageIds.length === 0) {
      return NextResponse.json({ message: "No packages selected." }, { status: 400 });
    }

    // Load user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true, email: true, name: true }
    });

    // Create Stripe customer if missing
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

    // Load packages
    const packages = await prisma.package.findMany({
      where: { id: { in: packageIds }, userId }
    });

    if (packages.length === 0) {
      return NextResponse.json({ message: "Packages not found." }, { status: 404 });
    }

    // Calculate fees — same logic as pay-pickup
    const STORAGE_FREE_DAYS = 30;
    const STORAGE_RATE_PER_CFT = 2.25;

    let totalStorage  = 0;
    let totalHandling = 0;

    for (const pkg of packages) {
      const now         = new Date();
      const arrivalDate = new Date(pkg.createdAt);
      const paidUntil   = (pkg as any).storagePaidUntil ? new Date((pkg as any).storagePaidUntil) : null;

      // Storage fee
      let storageFee = 0;
      if (paidUntil) {
        const daysPending = Math.floor((now.getTime() - paidUntil.getTime()) / (1000 * 60 * 60 * 24));
        if (daysPending > 0) {
          const length    = Number(pkg.lengthIn)  || 12;
          const width     = Number(pkg.widthIn)   || 12;
          const height    = Number(pkg.heightIn)  || 10;
          const volumeCft = (length * width * height) / 1728;
          const dailyRate = (volumeCft * STORAGE_RATE_PER_CFT) / 30;
          storageFee      = daysPending * dailyRate;
        }
      } else {
        const daysInWarehouse = Math.ceil(Math.abs(now.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysInWarehouse > STORAGE_FREE_DAYS) {
          const chargeableDays = daysInWarehouse - STORAGE_FREE_DAYS;
          const length         = Number(pkg.lengthIn)  || 12;
          const width          = Number(pkg.widthIn)   || 12;
          const height         = Number(pkg.heightIn)  || 10;
          const volumeCft      = (length * width * height) / 1728;
          const dailyRate      = (volumeCft * STORAGE_RATE_PER_CFT) / 30;
          storageFee           = chargeableDays * dailyRate;
        }
      }

      // Handling fee
      let handlingFee = 0;
      if (pkg.description !== "Documento Físico (Enviado desde Buzón)") {
        const w = Number(pkg.weightLbs) || 1;
        if      (w <= 10)  handlingFee = 2.50;
        else if (w <= 50)  handlingFee = 5.00;
        else if (w <= 150) handlingFee = 12.50;
        else               handlingFee = 30.00;
      }

      totalStorage  += storageFee;
      totalHandling += handlingFee;
    }

    const grandTotal = parseFloat((totalStorage + totalHandling).toFixed(2));
    const amountCents = Math.round(grandTotal * 100);

    if (amountCents < 50) {
      return NextResponse.json({ message: "Amount too low to process." }, { status: 400 });
    }

    // Create Stripe ephemeral key
    const ephemeralKeyObj = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2024-06-20' }
    );

    // Create PaymentIntent
    const pi = await stripe.paymentIntents.create({
      amount:      amountCents,
      currency:    'usd',
      customer:    customerId,
      description: `Warehouse Pickup — Storage $${totalStorage.toFixed(2)} + Handling $${totalHandling.toFixed(2)}`,
      metadata: {
        type:          'WAREHOUSE_PICKUP',
        packageIds:    packageIds.join(','),
        userId,
        scheduledDate: scheduledDate || '',
        scheduledTime: scheduledTime || '',
      },
    });

    return NextResponse.json({
      clientSecret:    pi.client_secret,
      paymentIntentId: pi.id,
      ephemeralKey:    ephemeralKeyObj.secret,
      customerId,
      grandTotal,
      totalStorage:    parseFloat(totalStorage.toFixed(2)),
      totalHandling:   parseFloat(totalHandling.toFixed(2)),
    });

  } catch (error: any) {
    console.error("❌ checkout-pickup-mobile:", error);
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 });
  }
}