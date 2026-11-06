import { getMobileUser } from '@/lib/getMobileUser';
import { NextResponse } from "next/server";

// 👇 VACUNA 1: Forzar modo dinámico (Vital para Stripe)
export const dynamic = 'force-dynamic';

// GET: Listar tarjetas — sincroniza Stripe → BD local → devuelve todo
export async function GET(req: Request) {
  const { auth } = await import("@/auth");
  const prisma = (await import("@/lib/prisma")).default;
  const { stripe } = await import("@/lib/stripe");

  const session = await auth();
  const mobileUser = await getMobileUser(req);
  const userId = session?.user?.id || mobileUser?.id;
  if (!userId) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true }
  });

  if (!user?.stripeCustomerId) {
    return NextResponse.json({ cards: [] });
  }

  let stripePms: any[] = [];
  try {
    const list = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
    });
    stripePms = list.data;
  } catch (e) {
    console.error('Error listando PMs de Stripe:', e);
    const local = await prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' }
    });
    return NextResponse.json({ cards: local });
  }

  if (stripePms.length === 0) {
    await prisma.paymentMethod.deleteMany({ where: { userId } });
    return NextResponse.json({ cards: [] });
  }

  const customer = await stripe.customers.retrieve(user.stripeCustomerId) as any;
  const defaultPmId = customer?.invoice_settings?.default_payment_method || null;

  for (const pm of stripePms) {
    if (!pm.card) continue;
    await prisma.paymentMethod.upsert({
      where: { stripePaymentMethodId: pm.id },
      update: {
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year,
        isDefault: pm.id === defaultPmId,
      },
      create: {
        userId,
        stripePaymentMethodId: pm.id,
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year,
        isDefault: pm.id === defaultPmId,
        isBackup: false,
      }
    });
  }

  const stripeIds = stripePms.map(pm => pm.id);
  await prisma.paymentMethod.deleteMany({
    where: {
      userId,
      stripePaymentMethodId: { notIn: stripeIds }
    }
  });

  const cards = await prisma.paymentMethod.findMany({
    where: { userId },
    orderBy: { isDefault: 'desc' }
  });

  return NextResponse.json({ cards });
}
// POST: Guardar referencia de tarjeta nueva y forzarla para los cobros automáticos de la suscripción
export async function POST(req: Request) {
  try {
    // 👇 VACUNA 2: Imports dentro de la función
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;
    const { stripe } = await import("@/lib/stripe");

    const session = await auth();
    const mobileUser = await getMobileUser(req);
    const userId = session?.user?.id || mobileUser?.id;
    if (!userId) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const body = await req.json();
    let paymentMethodId = body.paymentMethodId;

    // Si viene setupIntentId, consultamos Stripe para obtener el paymentMethod
    if (!paymentMethodId && body.setupIntentId) {
      const setupIntent = await stripe.setupIntents.retrieve(body.setupIntentId);
      if (!setupIntent.payment_method) {
        return NextResponse.json({ message: "SetupIntent sin tarjeta adjunta" }, { status: 400 });
      }
      paymentMethodId = setupIntent.payment_method as string;
    }

    if (!paymentMethodId) {
      return NextResponse.json({ message: "Se requiere paymentMethodId o setupIntentId" }, { status: 400 });
    }

    // 1. Recuperar detalles de la tarjeta desde Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    if (!paymentMethod || !paymentMethod.card) {
        throw new Error("Método de pago inválido");
    }

    // 2. Extraer datos del usuario y su suscripción en la BD
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const activeSub = await prisma.mailboxSubscription.findUnique({
        where: { userId: userId }
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
        where: { userId: userId },
        data: { isDefault: false }
    });

    // 5. Guardar la nueva tarjeta como Default absoluto en BD local
    const newCard = await prisma.paymentMethod.create({
        data: {
            userId: userId,
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
    const mobileUser = await getMobileUser(req);
    const userId = session?.user?.id || mobileUser?.id;
    if (!userId) return NextResponse.json({ status: 401 });

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