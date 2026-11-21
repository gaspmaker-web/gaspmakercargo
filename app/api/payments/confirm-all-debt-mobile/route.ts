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

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== 'succeeded') {
      return NextResponse.json({ message: "Payment not completed" }, { status: 400 });
    }

    const { shipmentIds: shipRaw, packageIds: pkgRaw } = pi.metadata;
    const shipmentIds = shipRaw ? shipRaw.split(',').filter(Boolean) : [];
    const packageIds  = pkgRaw  ? pkgRaw.split(',').filter(Boolean)  : [];

    if (shipmentIds.length > 0) {
      await prisma.consolidatedShipment.updateMany({
        where: { id: { in: shipmentIds } },
        data:  { status: 'PAGADO' },
      });
    }

    if (packageIds.length > 0) {
      await prisma.package.updateMany({
        where: { id: { in: packageIds } },
        data:  { status: 'PAGADO', storageDebt: 0 },
      });
    }

    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error("❌ confirm-all-debt-mobile:", error);
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 });
  }
}
