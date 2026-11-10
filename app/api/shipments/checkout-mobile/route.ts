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
  } catch { return null; }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken(req);
    if (!user?.id || !user?.email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const { packageIds, selectedCourier, courierService, totalPaid, easypostRateId, easypostShipmentId, shippingAddressId, serviceType } = body;

    if (!packageIds?.length || !totalPaid) return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });

    const stripe = await getTenantStripe(process.env.TENANT_SLUG || 'gaspmaker');
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true, name: true, email: true, stripeCustomerId: true } });

    let customerId = dbUser?.stripeCustomerId;
    if (!customerId) {
      const existing = await stripe.customers.list({ email: user.email, limit: 1 });
      customerId = existing.data.length > 0 ? existing.data[0].id : (await stripe.customers.create({ email: user.email, name: dbUser?.name || 'Cliente GMC' })).id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    }

    const ephemeralKey = await stripe.ephemeralKeys.create({ customer: customerId }, { apiVersion: '2023-10-16' });
    const typeLabel: Record<string, string> = { AERIAL: 'Air Shipment', OCEAN: 'Ocean Shipment', LOCAL: 'Local Delivery' };
    const amountCents = Math.round(Number(totalPaid) * 100);

    const pi = await stripe.paymentIntents.create({
      amount: amountCents, currency: 'usd', customer: customerId, setup_future_usage: 'off_session',
      description: `GMC ${typeLabel[serviceType] || 'Shipment'} — ${packageIds.join(', ')}`,
      metadata: { userId: user.id, packageIds: packageIds.join(','), serviceType: serviceType || 'AERIAL', selectedCourier: selectedCourier || '', courierService: courierService || '', easypostRateId: easypostRateId || '', easypostShipmentId: easypostShipmentId || '', shippingAddressId: shippingAddressId || '', totalPaid: String(totalPaid) },
    });

    return NextResponse.json({ clientSecret: pi.client_secret, ephemeralKey: ephemeralKey.secret, customerId, paymentIntentId: pi.id });
  } catch (error: any) {
    console.error('[shipments/checkout-mobile]', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
