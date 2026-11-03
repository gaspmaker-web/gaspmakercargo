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
  try { const { payload } = await jwtVerify(token, secret); return payload as any; }
  catch { return null; }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken(req);
    if (!user?.id || !user?.email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { getTenant } = await import('@/lib/tenant');
    const tenant = await getTenant();
    const stripe = await getTenantStripe(process.env.TENANT_SLUG || 'gaspmaker');
    const body = await req.json();
    const { planType } = body;

    const tenantFull = await prisma.tenant.findUnique({ where: { id: tenant?.id || '' }, select: { stripe_mailbox_basic_price_id: true, stripe_mailbox_premium_price_id: true } });

    const { getTenantId } = await import('@/lib/tenant-cache');
    const { getTenantRate } = await import('@/lib/tenant-rates');
    const tenantId = await getTenantId(process.env.TENANT_SLUG || 'gaspmaker');
    const basicPrice = tenantId ? (await getTenantRate(tenantId, 'mailbox_basic_monthly')) ?? 7.99 : 7.99;
    const premiumPrice = tenantId ? (await getTenantRate(tenantId, 'mailbox_premium_monthly')) ?? 14.99 : 14.99;

    let priceId = '', amountToSave = 0, exactDbPlanName = '';
    if (planType === 'Digital Basic') {
      priceId = tenantFull?.stripe_mailbox_basic_price_id || 'price_1TBrULJwbF2jSvCs6ouoqK77';
      amountToSave = basicPrice; exactDbPlanName = 'Digital Basic';
    } else if (planType === 'Premium Cargo') {
      priceId = tenantFull?.stripe_mailbox_premium_price_id || 'price_1TBrV9JwbF2jSvCs8hx6RhSA';
      amountToSave = premiumPrice; exactDbPlanName = 'Premium Cargo';
    } else {
      return NextResponse.json({ error: 'Plan invalido' }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    let customerId = dbUser?.stripeCustomerId;
    if (!customerId) {
      const existing = await stripe.customers.list({ email: user.email, limit: 1 });
      customerId = existing.data.length > 0 ? existing.data[0].id : (await stripe.customers.create({ email: user.email, name: user.name || 'Cliente GMC' })).id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    }

    const subscription: any = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    const paymentIntent: any = subscription.latest_invoice?.payment_intent;
    if (!paymentIntent?.client_secret) throw new Error('No client_secret');

    const existingSub = await prisma.mailboxSubscription.findFirst({ where: { userId: user.id } });
    if (existingSub) {
      await prisma.mailboxSubscription.update({ where: { id: existingSub.id }, data: { planType: exactDbPlanName, stripeSubscriptionId: subscription.id, currentPeriodEnd: new Date(subscription.current_period_end * 1000), status: 'PENDING_PAYMENT' } });
    } else {
      await prisma.mailboxSubscription.create({ data: { userId: user.id, tenant_id: tenant?.id || null, planType: exactDbPlanName, stripeSubscriptionId: subscription.id, currentPeriodEnd: new Date(subscription.current_period_end * 1000), status: 'PENDING_PAYMENT' } });
    }

    await prisma.mailboxTransaction.create({ data: { userId: user.id, amount: amountToSave, description: exactDbPlanName === 'Digital Basic' ? 'SUSCRIPCION BUZON BASICO' : 'SUSCRIPCION BUZON PREMIUM', stripePaymentId: paymentIntent.id, status: 'PENDIENTE' } });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, subscriptionId: subscription.id });
  } catch (error: any) {
    console.error('[checkout-mobile]', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
