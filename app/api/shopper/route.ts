import { NextResponse } from "next/server"; 
import { auth } from "@/auth"; 
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 🏢 Tenant filter
    const { getTenant } = await import('@/lib/tenant');
    const tenant = await getTenant();
    const tenantFilter = tenant?.id ? { tenant_id: tenant.id } : {};

    const orders = await prisma.shopperOrder.findMany({
      where: { userId: session.user.id, ...tenantFilter },
      include: { items: true },
      orderBy: { createdAt: "desc" }
    });

    const savedCards = await prisma.paymentMethod.findMany({
      where: { userId: session.user.id }
    });

    const cardsWithStripeData = await Promise.all(
      savedCards.map(async (card) => {
        try {
          const stripePm = await stripe.paymentMethods.retrieve(card.stripePaymentMethodId);
          return {
            ...card,
            country: stripePm.card?.country || null
          };
        } catch (stripeError) {
          console.error(`Error consultando Stripe para la tarjeta ${card.id}:`, stripeError);
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
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 🏢 Tenant
    const { getTenant } = await import('@/lib/tenant');
    const tenant = await getTenant();

    const body = await req.json();
    const { items, itemsSubtotal } = body;

    const newOrder = await prisma.shopperOrder.create({
      data: {
        userId: session.user.id,
        tenant_id: tenant?.id || null,
        status: "PENDING_QUOTE",
        itemsSubtotal: itemsSubtotal,
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