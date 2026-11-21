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

    // Auth
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

    const { paymentIntentId } = await req.json();
    if (!paymentIntentId) return NextResponse.json({ message: "Missing paymentIntentId" }, { status: 400 });

    // Verify payment succeeded
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== 'succeeded') {
      return NextResponse.json({ message: "Payment not completed." }, { status: 400 });
    }

    // Extract metadata
    const { packageIds: packageIdsStr, scheduledDate, scheduledTime } = pi.metadata;
    const packageIds = packageIdsStr ? packageIdsStr.split(',') : [];
    const grandTotal = pi.amount / 100;

    if (packageIds.length === 0) {
      return NextResponse.json({ message: "No packages found in payment." }, { status: 400 });
    }

    // Update packages — clear storage debt
    const now = new Date();
    await Promise.all(packageIds.map((id: string) =>
      prisma.package.update({
        where: { id },
        data: {
          storageDebt:     0,
          storagePaidUntil: now,
        }
      })
    ));

    // Send notification
    try {
      await sendNotification({
        userId,
        title:   JSON.stringify({ key: "paymentSuccessTitle" }),
        message: JSON.stringify({ key: "paymentSuccessDesc", amount: grandTotal.toFixed(2) }),
        type:    "SUCCESS",
        href:    `/dashboard-cliente`
      });
    } catch {}

    // Create pickup appointment
    const { getTenant } = await import('@/lib/tenant');
    const tenant = await getTenant();

    const pickupShipment = await prisma.consolidatedShipment.create({
      data: {
        userId,
        tenant_id:            tenant?.id || null,
        gmcShipmentNumber:    `PICKUP-${Date.now().toString().slice(-6)}`,
        status:               'PAGADO',
        destinationCountryCode: 'USA',
        serviceType:          'PICKUP',
        courierService:       scheduledDate && scheduledTime
          ? `Cita: ${scheduledDate} ${scheduledTime}`
          : 'Warehouse Pickup',
        totalAmount:          grandTotal,
        subtotalAmount:       grandTotal,
        paymentId:            pi.id,
        weightLbs:            0,
        packages: { connect: packageIds.map((id: string) => ({ id })) }
      }
    });

    // Update package status
    await prisma.package.updateMany({
      where: { id: { in: packageIds } },
      data:  { status: 'PENDIENTE_RETIRO' }
    });

    return NextResponse.json({
      success:    true,
      message:    "Payment successful. Pickup scheduled.",
      shipmentId: pickupShipment.id,
    });

  } catch (error: any) {
    console.error("❌ confirm-pickup-mobile:", error);
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 });
  }
}