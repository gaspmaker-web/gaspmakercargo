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

async function getClientSecretFromInvoice(stripe: any, invoiceId: string): Promise<{ clientSecret: string; paymentIntentId: string }> {
  // Retrieve invoice with payment_intent expanded
  const invoice: any = await stripe.invoices.retrieve(invoiceId, {
    expand: ['payment_intent'],
  });

  if (invoice.payment_intent && typeof invoice.payment_intent === 'object' && invoice.payment_intent.client_secret) {
    return { clientSecret: invoice.payment_intent.client_secret, paymentIntentId: invoice.payment_intent.id };
  }

  if (typeof invoice.payment_intent === 'string') {
    const pi = await stripe.paymentIntents.retrieve(invoice.payment_intent);
    if (pi.client_secret) return { clientSecret: pi.client_secret, paymentIntentId: pi.id };
  }

  // No payment_intent on invoice — create one manually for the invoice amount
  const pi = await stripe.paymentIntents.create({
    amount: invoice.amount_due,
    currency: invoice.currency,
    customer: invoice.customer as string,
    metadata: { invoice_id: invoiceId },
    setup_future_usage: 'off_session',
  });

  return { clientSecret: pi.client_secret!, paymentIntentId: pi.id };
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
      select: {
        id: true,
        stripe_mailbox_basic_price_id: true,
        stripe_mailbox_premium_price_id: true,
      },
    });

    let priceId = '';
    let amountToSave = 0;
    let exactDbPlanName = '';

    if (planType === 'Digital Basic') {
      priceId = tenant?.stripe_mailbox_basic_price_id || '';
      amountToSave = 7.99;
      exactDbPlanName = 'Digital Basic';
    } else if (planType === 'Premium Cargo') {
      priceId = tenant?.stripe_mailbox_premium_price_id || '';
      amountToSave = 14.99;
      exactDbPlanName = 'Premium Cargo';
    } else {
      return NextResponse.json({ error: 'Plan invalido' }, { status: 400 });
    }

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID no configurado' }, { status: 500 });
    }

    // Get or create Stripe customer
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    let customerId = dbUser?.stripeCustomerId;
    if (!customerId) {
      const existing = await stripe.customers.list({ email: user.email, limit: 1 });
      customerId = existing.data.length > 0
        ? existing.data[0].id
        : (await stripe.customers.create({ email: user.email, name: user.name || 'Cliente GMC' })).id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    }

    // Create subscription with default_incomplete behavior
    const subscription: any = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    const latestInvoice: any = subscription.latest_invoice;
    const invoiceId = typeof latestInvoice === 'string' ? latestInvoice : latestInvoice?.id;

    if (!invoiceId) {
      throw new Error('No invoice found on subscription');
    }

    const { clientSecret, paymentIntentId } = await getClientSecretFromInvoice(stripe, invoiceId);

    // Upsert mailbox subscription record
    const existingSub = await prisma.mailboxSubscription.findFirst({ where: { userId: user.id } });
    if (existingSub) {
      await prisma.mailboxSubscription.update({
        where: { id: existingSub.id },
        data: {
          planType: exactDbPlanName,
          stripeSubscriptionId: subscription.id,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          status: 'PENDING_PAYMENT',
        },
      });
    } else {
      await prisma.mailboxSubscription.create({
        data: {
          userId: user.id,
          tenant_id: tenant?.id ?? null,
          planType: exactDbPlanName,
          stripeSubscriptionId: subscription.id,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          status: 'PENDING_PAYMENT',
        },
      });
    }

    await prisma.mailboxTransaction.create({
      data: {
        userId: user.id,
        amount: amountToSave,
        description: exactDbPlanName === 'Digital Basic'
          ? 'SUSCRIPCION BUZON BASICO'
          : 'SUSCRIPCION BUZON PREMIUM',
        stripePaymentId: paymentIntentId,
        status: 'PENDIENTE',
      },
    });

    return NextResponse.json({ clientSecret, subscriptionId: subscription.id });

  } catch (error: any) {
    console.error('[checkout-mobile]', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
