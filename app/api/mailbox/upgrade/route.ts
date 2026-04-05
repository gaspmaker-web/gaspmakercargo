import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 🔴 IMPORTANTE: Reemplaza esto con el ID real de tu precio Premium en Stripe
    const PREMIUM_PRICE_ID = 'price_12345_premium'; 

    // 1. OBTENER AL USUARIO Y SU PLAN ACTUAL
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { mailboxSubscription: true }
    });

    const sub = user?.mailboxSubscription;

    // 🔥 CORRECCIÓN CRÍTICA: Ahora reconoce tanto 'BASIC_799' como 'Digital Basic'
    if (!user || !sub || (sub.planType !== 'BASIC_799' && sub.planType !== 'Digital Basic')) {
      return NextResponse.json({ error: 'No eres elegible para este Upgrade o no tienes un plan activo' }, { status: 400 });
    }

    if (!user.stripeCustomerId) {
      return NextResponse.json({ error: 'No se encontró tu Billetera Digital. Contacta a soporte.' }, { status: 400 });
    }

    // 2. 💳 LÓGICA DE STRIPE: BUSCAMOS LA TARJETA EN SU DIGITAL WALLET
    let defaultPaymentMethod = '';
    const customer = await stripe.customers.retrieve(user.stripeCustomerId) as Stripe.Customer;
    
    // Intentamos sacar la tarjeta por defecto de la facturación
    if (customer.invoice_settings?.default_payment_method) {
      defaultPaymentMethod = customer.invoice_settings.default_payment_method as string;
    } else {
      // Si no, buscamos la primera tarjeta que tenga guardada en su Billetera
      const paymentMethods = await stripe.paymentMethods.list({ customer: user.stripeCustomerId, type: 'card' });
      if (paymentMethods.data.length > 0) {
        defaultPaymentMethod = paymentMethods.data[0].id;
      }
    }

    if (!defaultPaymentMethod) {
      return NextResponse.json({ error: 'No tienes una tarjeta guardada para el cobro automático.' }, { status: 402 });
    }

    // 3. 🔄 CANCELAR EL PLAN VIEJO Y CREAR EL NUEVO (COBRO COMPLETO INMEDIATO)
    if (sub.stripeSubscriptionId) {
      console.log(`Cancelando plan viejo: ${sub.stripeSubscriptionId}`);
      await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
    }

    console.log(`Iniciando nueva suscripción Premium para: ${user.stripeCustomerId}`);
    const newSubscription = await stripe.subscriptions.create({
      customer: user.stripeCustomerId,
      items: [{ price: PREMIUM_PRICE_ID }],
      default_payment_method: defaultPaymentMethod, // 🔥 Usamos la tarjeta guardada
      expand: ['latest_invoice.payment_intent'],
    });

    // Verificamos que el pago se haya completado
    const invoice = newSubscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    if (paymentIntent?.status !== 'succeeded' && paymentIntent?.status !== 'processing') {
      return NextResponse.json({ error: 'El cobro automático a tu tarjeta falló. Revisa tus fondos.' }, { status: 402 });
    }

    const currentPeriodEnd = new Date(newSubscription.current_period_end * 1000);

    // 4. 🗄️ ACTUALIZAR SUPABASE INSTANTÁNEAMENTE Y REGISTRAR EN FINANZAS
    await prisma.$transaction([
      // A. Actualizamos el Buzón a Premium
      prisma.mailboxSubscription.update({
        where: { id: sub.id },
        data: { 
          planType: 'PREMIUM_1499',
          stripeSubscriptionId: newSubscription.id,
          currentPeriodEnd: currentPeriodEnd
        }
      }),
      
      // B. Registramos el pago en la tabla de Finanzas para el Admin
      prisma.mailboxTransaction.create({
        data: {
          userId: user.id,
          amount: 14.99,
          description: "UPGRADE A PREMIUM CARGO",
          stripePaymentId: paymentIntent.id,
          status: "COMPLETADO"
        }
      })
    ]);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error procesando el Upgrade:", error);
    return NextResponse.json({ error: 'Error interno del servidor procesando el pago' }, { status: 500 });
  }
}