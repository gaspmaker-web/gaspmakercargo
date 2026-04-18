import { NextResponse } from "next/server"; 
import { auth } from "@/auth"; 
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe"; // 🔥 Importamos Stripe para validar el país

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const orders = await prisma.shopperOrder.findMany({
      where: { userId: session.user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" }
    });

    const savedCards = await prisma.paymentMethod.findMany({
      where: { userId: session.user.id }
    });

    // 🔥 NIVEL ENTERPRISE: Enriquecemos las tarjetas locales con el país real de Stripe
    const cardsWithStripeData = await Promise.all(
      savedCards.map(async (card) => {
        try {
          const stripePm = await stripe.paymentMethods.retrieve(card.stripePaymentMethodId);
          return {
            ...card,
            country: stripePm.card?.country || null // <- Aquí capturamos el país (Ej: 'TT', 'US')
          };
        } catch (stripeError) {
          console.error(`Error consultando Stripe para la tarjeta ${card.id}:`, stripeError);
          return { ...card, country: null };
        }
      })
    );

    // Enviamos las tarjetas ya enriquecidas al frontend
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

    const body = await req.json();
    const { items, itemsSubtotal } = body;

    const newOrder = await prisma.shopperOrder.create({
      data: {
        userId: session.user.id,
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