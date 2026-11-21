import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { getUserFromToken } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { shipmentId, amountNet, packageIds } = await req.json();

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.name ?? undefined });
      stripeCustomerId = customer.id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId } });
    }

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: stripeCustomerId },
      { apiVersion: '2024-06-20' }
    );

    const amountCents = Math.round(amountNet * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      customer: stripeCustomerId,
      automatic_payment_methods: { enabled: true },
      metadata: {
        type: 'SHIPMENT_PAYMENT',
        shipmentId,
        userId: user.id,
        packageIds: JSON.stringify(packageIds),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      ephemeralKey: ephemeralKey.secret,
      customerId: stripeCustomerId,
    });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}