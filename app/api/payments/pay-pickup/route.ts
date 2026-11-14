import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;
    const Stripe = (await import("stripe")).default;
    const { sendNotification } = await import('@/lib/notifications');

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

    const { packageIds, paymentMethodId, scheduledDate, scheduledTime } = await req.json();

    if (!packageIds || !Array.isArray(packageIds) || packageIds.length === 0) {
      return NextResponse.json({ message: "No packages selected." }, { status: 400 });
    }
    if (!paymentMethodId) {
      return NextResponse.json({ message: "No payment method selected." }, { status: 400 });
    }

    // Load user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true, email: true, name: true }
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json({ message: "Payment configuration not found." }, { status: 400 });
    }

    // Load packages
    const packages = await prisma.package.findMany({
      where: { id: { in: packageIds }, userId }
    });
    console.log('pay-pickup packageIds:', packageIds);
console.log('pay-pickup found packages:', packages.length);

    if (packages.length === 0) {
      return NextResponse.json({ message: "Packages not found." }, { status: 404 });
    }

    // Calculate fees per package
    const STORAGE_FREE_DAYS = 30;
    const STORAGE_RATE_PER_CFT = 2.25;

    let totalStorage = 0;
    let totalHandling = 0;

    for (const pkg of packages) {
      const now = new Date();
      const arrivalDate = new Date(pkg.createdAt);
      const paidUntil = (pkg as any).storagePaidUntil ? new Date((pkg as any).storagePaidUntil) : null;

      // Storage fee
      let storageFee = 0;
      if (paidUntil) {
        const daysPending = Math.floor((now.getTime() - paidUntil.getTime()) / (1000 * 60 * 60 * 24));
        if (daysPending > 0) {
          const length = Number(pkg.lengthIn) || 12;
          const width = Number(pkg.widthIn) || 12;
          const height = Number(pkg.heightIn) || 10;
          const volumeCft = (length * width * height) / 1728;
          const dailyRate = (volumeCft * STORAGE_RATE_PER_CFT) / 30;
          storageFee = daysPending * dailyRate;
        }
      } else {
        const daysInWarehouse = Math.ceil(Math.abs(now.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysInWarehouse > STORAGE_FREE_DAYS) {
          const chargeableDays = daysInWarehouse - STORAGE_FREE_DAYS;
          const length = Number(pkg.lengthIn) || 12;
          const width = Number(pkg.widthIn) || 12;
          const height = Number(pkg.heightIn) || 10;
          const volumeCft = (length * width * height) / 1728;
          const dailyRate = (volumeCft * STORAGE_RATE_PER_CFT) / 30;
          storageFee = chargeableDays * dailyRate;
        }
      }

      // Handling fee
      let handlingFee = 0;
      if (pkg.description !== "Documento Físico (Enviado desde Buzón)") {
        const w = Number(pkg.weightLbs) || 1;
        if (w <= 10) handlingFee = 2.50;
        else if (w <= 50) handlingFee = 5.00;
        else if (w <= 150) handlingFee = 12.50;
        else handlingFee = 30.00;
      }

      totalStorage += storageFee;
      totalHandling += handlingFee;
    }

    const grandTotal = parseFloat((totalStorage + totalHandling).toFixed(2));

    if (grandTotal < 0.50) {
      return NextResponse.json({ message: "Amount too low to process." }, { status: 400 });
    }

    // Find card - support both DB id and Stripe pm_xxx id
    const savedCard = await prisma.paymentMethod.findFirst({
      where: {
        OR: [{ id: paymentMethodId }, { stripePaymentMethodId: paymentMethodId }],
        userId
      }
    });

    if (!savedCard?.stripePaymentMethodId) {
      return NextResponse.json({ message: "Payment method not found." }, { status: 400 });
    }

    // Charge Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(grandTotal * 100),
      currency: "usd",
      customer: user.stripeCustomerId,
      payment_method: savedCard.stripePaymentMethodId,
      off_session: true,
      confirm: true,
      description: `Warehouse Pickup - Storage $${totalStorage.toFixed(2)} + Handling $${totalHandling.toFixed(2)}`,
      metadata: {
        packageIds: packageIds.join(','),
        type: 'WAREHOUSE_PICKUP',
        userId
      }
    });

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ message: "Payment was declined." }, { status: 400 });
    }

    // Update packages - clear storage debt
    const now = new Date();
    await Promise.all(packages.map(pkg =>
      prisma.package.update({
        where: { id: pkg.id },
        data: {
          storageDebt: 0,
          storagePaidUntil: now,
        }
      })
    ));

    // Send notification
    try {
      await sendNotification({
        userId,
        title: JSON.stringify({ key: "paymentSuccessTitle" }),
        message: JSON.stringify({ key: "paymentSuccessDesc", amount: grandTotal.toFixed(2) }),
        type: "SUCCESS",
        href: `/dashboard-cliente`
      });
    } catch {}

        // Create the pickup appointment with PAGADO status
    const { getTenant } = await import('@/lib/tenant');
    const tenant = await getTenant();
    
    const pickupShipment = await prisma.consolidatedShipment.create({
      data: {
        userId,
        tenant_id: tenant?.id || null,
        gmcShipmentNumber: `PICKUP-${Date.now().toString().slice(-6)}`,
        status: 'PAGADO',
        destinationCountryCode: 'USA',
        serviceType: 'PICKUP',
        courierService: scheduledDate && scheduledTime ? `Cita: ${scheduledDate} ${scheduledTime}` : 'Warehouse Pickup',
        totalAmount: grandTotal,
        subtotalAmount: grandTotal,
        paymentId: paymentIntent.id,
        weightLbs: packages.reduce((acc, p) => acc + (Number(p.weightLbs) || 0), 0),
        packages: { connect: packageIds.map((id: string) => ({ id })) }
      }
    });

    await prisma.package.updateMany({
      where: { id: { in: packageIds } },
      data: { status: 'PENDIENTE_RETIRO' }
    });

    return NextResponse.json({
      success: true,
      message: "Payment successful. Pickup scheduled.",
      amountCharged: grandTotal,
      paymentIntentId: paymentIntent.id,
      shipmentId: pickupShipment.id
    });
  } catch (error: any) {
    console.error("❌ Error in pay-pickup:", error);
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 });
  }
}