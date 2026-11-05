import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from 'jose';
import { getTenantStripe } from '@/lib/tenant-stripe';

export const dynamic = 'force-dynamic';

async function getUserFromToken(req: Request) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'secret');
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as any;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken(req);
    if (!user?.id || !user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const stripe = await getTenantStripe(process.env.TENANT_SLUG || 'gaspmaker');
    const body = await req.json();
    const { planType } = body;

    const tenant = await prisma.tenant.findFirst({
      where: { slug: process.env.TENANT_SLUG || 'gaspmaker' },
      select: { id: true, stripe_mailbox_basic_price_id: true, stripe_mailbox_premium_price_id: true },
    });

    let priceId = '';
    let amountCents = 0;
    let amountToSave = 0;
    let exactDbPlanName = '';

    if (planType === 'Digital Basic') {
      priceId = tenant?.stripe_mailbox_basic_price_id || '';
      amountCents = 799;
      amountToSave = 7.99;
      exactDbPlanName = 'Digital Basic';
    } else if (planType === 'Premium Cargo') {
      priceId = tenant?.stripe_mailbox_premium_price_id || '';
      amountCents = 1499;
      amountToSave = 14.99;
      exactDbPlanName = 'Premium Cargo';
    } else {
      return NextResponse.json({ error: 'Plan invalido' }, { status: 400 });
    }

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID no configurado' }, { status: 500 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    let customerId = dbUser?.stripeCustomerId;
    if (!customerId) {
      const existing = await stripe.customers.list({ email: user.email, limit: 1 });
      customerId = existing.data.length > 0
        ? existing.data[0].id
        : (await stripe.customers.create({ email: user.email, name: user.name || 'Cliente GMC' })).id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    }

   // Cancel incomplete subscriptions (duplicates prevention)
const incompleteSubs = await stripe.subscriptions.list({ customer: customerId, status: 'incomplete' });
for (const sub of incompleteSubs.data) {
  await stripe.subscriptions.cancel(sub.id);
}

// If upgrading: cancel existing active subscription
const currentSub = await prisma.mailboxSubscription.findFirst({
  where: { userId: user.id, status: 'ACTIVE' },
});
if (currentSub?.stripeSubscriptionId) {
  try {
    await stripe.subscriptions.cancel(currentSub.stripeSubscriptionId);
  } catch (e) {
    // ignore if already cancelled
  }
}

    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: '' as any },
    });

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2023-10-16' }
    );

    const subscription: any = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
    });

    const invoiceId = typeof subscription.latest_invoice === 'string'
      ? subscription.latest_invoice
      : subscription.latest_invoice?.id;

    if (!invoiceId) {
      return NextResponse.json({ error: 'No se pudo obtener la invoice' }, { status: 500 });
    }

    const invoice: any = await stripe.invoices.retrieve(invoiceId, {
      expand: ['payment_intent'],
    });

    let clientSecret: string | null = null;
    let paymentIntentId: string | null = null;

    if (invoice?.payment_intent && typeof invoice.payment_intent === 'object' && invoice.payment_intent.client_secret) {
      clientSecret = invoice.payment_intent.client_secret;
      paymentIntentId = invoice.payment_intent.id;
    } else if (invoice?.payment_intent && typeof invoice.payment_intent === 'string') {
      const pi = await stripe.paymentIntents.retrieve(invoice.payment_intent);
      clientSecret = pi.client_secret;
      paymentIntentId = pi.id;
    } else {
      const pi = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'usd',
        customer: customerId,
        metadata: {
          subscriptionId: subscription.id,
          invoiceId,
          planType: exactDbPlanName,
          userId: user.id,
        },
        setup_future_usage: 'off_session',
      });
      clientSecret = pi.client_secret;
      paymentIntentId = pi.id;
      console.log('[checkout-mobile] Created manual PaymentIntent:', pi.id, 'for subscription:', subscription.id);
    }

    if (!clientSecret) {
      console.error('[checkout-mobile] Fatal: no client_secret after all fallbacks');
      return NextResponse.json(
        { error: 'No se pudo obtener el client_secret para procesar el pago' },
        { status: 500 }
      );
    }

    const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const existingSub = await prisma.mailboxSubscription.findFirst({ where: { userId: user.id } });
    if (existingSub) {
      await prisma.mailboxSubscription.update({
        where: { id: existingSub.id },
        data: { planType: exactDbPlanName, stripeSubscriptionId: subscription.id, currentPeriodEnd, status: 'PENDING_PAYMENT' },
      });
    } else {
      await prisma.mailboxSubscription.create({
        data: { userId: user.id, tenant_id: tenant?.id ?? null, planType: exactDbPlanName, stripeSubscriptionId: subscription.id, currentPeriodEnd, status: 'PENDING_PAYMENT' },
      });
    }

    await prisma.mailboxTransaction.create({
      data: {
        userId: user.id,
        amount: amountToSave,
        description: exactDbPlanName === 'Digital Basic' ? 'SUSCRIPCION BUZON BASICO' : 'SUSCRIPCION BUZON PREMIUM',
        stripePaymentId: paymentIntentId!,
        status: 'PENDIENTE',
      },
    });

    return NextResponse.json({
      clientSecret,
      subscriptionId: subscription.id,
      ephemeralKey: ephemeralKey.secret,
      customerId,
    });

  } catch (error: any) {
    console.error('[checkout-mobile]', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
