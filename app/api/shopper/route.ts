import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { jwtVerify } from 'jose';
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// ─── Auth helper: NextAuth session OR mobile JWT Bearer ───────────────────────
async function getUserId(req: Request): Promise<string | null> {
  // 1) Try mobile JWT Bearer token
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
      const { payload } = await jwtVerify(token, secret);
      return (payload as any).id || (payload as any).userId || null;
    } catch {}
  }
  // 2) Fallback to NextAuth session (web)
  const session = await auth();
  return session?.user?.id || null;
}

export async function GET(req: Request) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { getTenant } = await import('@/lib/tenant');
    const tenant = await getTenant();
    const tenantFilter = tenant?.id ? { tenant_id: tenant.id } : {};

    const orders = await prisma.shopperOrder.findMany({
      where: { userId, ...tenantFilter },
      include: { items: true },
      orderBy: { createdAt: "desc" }
    });

    const savedCards = await prisma.paymentMethod.findMany({
      where: { userId }
    });

    const cardsWithStripeData = await Promise.all(
      savedCards.map(async (card) => {
        try {
          const stripePm = await stripe.paymentMethods.retrieve(card.stripePaymentMethodId);
          return { ...card, country: stripePm.card?.country || null };
        } catch {
          return { ...card, country: null };
        }
      })
    );

    return NextResponse.json({ orders, savedCards: cardsWithStripeData });
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener órdenes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { getTenant } = await import('@/lib/tenant');
    const tenant = await getTenant();

    const body = await req.json();
    const { items, itemsSubtotal } = body;

    const newOrder = await prisma.shopperOrder.create({
      data: {
        userId,
        tenant_id: tenant?.id || null,
        status: "PENDING_QUOTE",
        itemsSubtotal,
        items: {
          create: items.map((item: any) => ({
            productUrl: item.url,
            details: item.details || "",
            quantity: item.quantity,
            declaredPrice: item.price,
          })),
        },
      },
    });

    return NextResponse.json({ success: true, orderId: newOrder.id }, { status: 200 });
  } catch (error) {
    console.error("Error creando orden Shopper:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}