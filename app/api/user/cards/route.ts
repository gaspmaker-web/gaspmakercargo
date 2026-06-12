import { NextResponse } from "next/server";

// 👇 VACUNA 1: Forzar modo dinámico (Vital para Stripe)
export const dynamic = 'force-dynamic';

// GET: Listar tarjetas guardadas (🔥 AHORA ENRIQUECIDAS CON STRIPE 🔥)
export async function GET(req: Request) {
  // 👇 VACUNA 2: Imports dentro de la función (Lazy Loading)
  const { auth } = await import("@/auth");
  const prisma = (await import("@/lib/prisma")).default;
  const { stripe } = await import("@/lib/stripe"); // 🔥 IMPORTAMOS STRIPE AQUÍ TAMBIÉN

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

  const rawCards = await prisma.paymentMethod.findMany({
    where: { userId: session.user.id },
    orderBy: { isDefault: 'desc' } // Muestra la predeterminada primero
  });

  // 🔥 NIVEL ENTERPRISE: Cruzamos con Stripe para extraer el país (country)
  const cardsWithCountry = await Promise.all(
    rawCards.map(async (card) => {
      try {
        if (!card.stripePaymentMethodId) return { ...card, country: null };
        const stripePm = await stripe.paymentMethods.retrieve(card.stripePaymentMethodId);
        return {
          ...card,
          country: stripePm.card?.country || null
        };
      } catch (error) {
        console.error(`Error consultando Stripe para la tarjeta ${card.id}:`, error);
        return { ...card, country: null };
      }
    })
  );

  // Devolvemos las tarjetas ya con el país incluido
  return NextResponse.json({ cards: cardsWithCountry });
}

// POST: Guardar referencia de tarjeta nueva y forzarla para los cobros automáticos de la suscripción
export async function POST(req: Request) {
  try {
    // 👇 VACUNA 2: Imports dentro de la función
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;
    const { stripe } = await import("@/lib/stripe");

    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const { paymentMethodId } = await req.json();

    // 1. Recuperar detalles de la tarjeta desde Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    if (!paymentMethod || !paymentMethod.card) {
        throw new Error("Método de pago inválido");
    }

    // 2. Extraer datos del usuario y su suscripción en la BD
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    const activeSub = await prisma.mailboxSubscription.findUnique({
        where: { userId: session.user.id }
    });

    // 3. 🛡️ OPERACIÓN MAESTRA EN STRIPE 🛡️
    if (user?.stripeCustomerId) {
        try {
            // A. Vincular la tarjeta al perfil del cliente
            await stripe.paymentMethods.attach(paymentMethod.id, { customer: user.stripeCustomerId });
        } catch (attachError: any) {
            if (attachError.code !== 'resource_already_exists') {
                console.error("Error al adjuntar tarjeta:", attachError);
            }
        }

        // B. Hacer que sea la tarjeta por defecto del cliente
        await stripe.customers.update(user.stripeCustomerId, {
            invoice_settings: { default_payment_method: paymentMethod.id }
        });

        // C. Si tiene suscripción activa, ordenarle al contrato que use esta tarjeta
        if (activeSub?.stripeSubscriptionId?.startsWith('sub_')) {
            await stripe.subscriptions.update(activeSub.stripeSubscriptionId, {
                default_payment_method: paymentMethod.id
            });
        }
    }

    // 4. Quitar el estado 'Default' a las tarjetas anteriores en la BD local
    await prisma.paymentMethod.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false }
    });

    // 5. Guardar la nueva tarjeta como Default absoluto en BD local
    const newCard = await prisma.paymentMethod.create({
        data: {
            userId: session.user.id,
            stripePaymentMethodId: paymentMethod.id,
            brand: paymentMethod.card.brand,
            last4: paymentMethod.card.last4,
            expMonth: paymentMethod.card.exp_month,
            expYear: paymentMethod.card.exp_year,
            isDefault: true, // Siempre es verdadera para la nueva
            isBackup: false
        }
    });

    return NextResponse.json({ success: true, card: newCard });

  } catch (error: any) {
    console.error("Error saving card:", error);
    return NextResponse.json({ message: "Error al guardar tarjeta" }, { status: 500 });
  }
}

// DELETE: Borrar tarjeta
export async function DELETE(req: Request) {
    // 👇 VACUNA 2: Imports dentro de la función
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;
    const { stripe } = await import("@/lib/stripe");

    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ status: 401 });

    const { cardId } = await req.json();

    // Buscar tarjeta en BD
    const card = await prisma.paymentMethod.findUnique({ where: { id: cardId } });
    if (!card) return NextResponse.json({ message: "Tarjeta no encontrada" }, { status: 404 });

    // Desvincular de Stripe
    try {
        await stripe.paymentMethods.detach(card.stripePaymentMethodId);
    } catch (e) {
        console.error("Error Stripe detach (puede que ya no exista):", e);
    }

    // Borrar de BD
    await prisma.paymentMethod.delete({ where: { id: cardId } });

    return NextResponse.json({ success: true });
}