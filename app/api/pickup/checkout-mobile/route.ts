// app/api/pickup/checkout-mobile/route.ts
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';
import { getTenantStripe } from '@/lib/tenant-stripe';
import { getProcessingFee } from '@/lib/stripeCalc';
import { calculateAuraLocalDelivery, DEFAULT_AURA_RATES } from '@/lib/aura-engine';
import { getTenantId } from '@/lib/tenant-cache';
import { getTenantRates } from '@/lib/tenant-rates';

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
    if (!user?.id || !user?.email) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const tenantSlug  = process.env.TENANT_SLUG || 'gaspmaker';
    const tenantId    = await getTenantId(tenantSlug);
    const tenantRates = tenantId ? await getTenantRates(tenantId) : {};

    const auraRates = {
      ...DEFAULT_AURA_RATES,
      base_0_40:    Number(tenantRates['local_base_0_40lbs']    ?? DEFAULT_AURA_RATES.base_0_40),
      base_41_50:   Number(tenantRates['local_base_41_50lbs']   ?? DEFAULT_AURA_RATES.base_41_50),
      base_51_60:   Number(tenantRates['local_base_51_60lbs']   ?? DEFAULT_AURA_RATES.base_51_60),
      base_61_70:   Number(tenantRates['local_base_61_70lbs']   ?? DEFAULT_AURA_RATES.base_61_70),
      base_71_80:   Number(tenantRates['local_base_71_80lbs']   ?? DEFAULT_AURA_RATES.base_71_80),
      base_81_90:   Number(tenantRates['local_base_81_90lbs']   ?? DEFAULT_AURA_RATES.base_81_90),
      base_91_100:  Number(tenantRates['local_base_91_100lbs']  ?? DEFAULT_AURA_RATES.base_91_100),
      base_101_110: Number(tenantRates['local_base_101_110lbs'] ?? DEFAULT_AURA_RATES.base_101_110),
      base_111_120: Number(tenantRates['local_base_111_120lbs'] ?? DEFAULT_AURA_RATES.base_111_120),
      base_121_130: Number(tenantRates['local_base_121_130lbs'] ?? DEFAULT_AURA_RATES.base_121_130),
      base_131_140: Number(tenantRates['local_base_131_140lbs'] ?? DEFAULT_AURA_RATES.base_131_140),
      base_141_150: Number(tenantRates['local_base_141_150lbs'] ?? DEFAULT_AURA_RATES.base_141_150),
      base_151_500: Number(tenantRates['local_base_151_500lbs'] ?? DEFAULT_AURA_RATES.base_151_500),
      base_501_600: Number(tenantRates['local_base_501_600lbs'] ?? DEFAULT_AURA_RATES.base_501_600),
      base_601_800: Number(tenantRates['local_base_601_800lbs'] ?? DEFAULT_AURA_RATES.base_601_800),
      base_801plus: Number(tenantRates['local_base_801plus']    ?? DEFAULT_AURA_RATES.base_801plus),
      rate_car_suv:   Number(tenantRates['local_per_mile_car_suv']   ?? DEFAULT_AURA_RATES.rate_car_suv),
      rate_minivan:   Number(tenantRates['local_per_mile_minivan']   ?? DEFAULT_AURA_RATES.rate_minivan),
      rate_cargo_van: Number(tenantRates['local_per_mile_cargo_van'] ?? DEFAULT_AURA_RATES.rate_cargo_van),
      rate_box_truck: Number(tenantRates['local_per_mile_box_truck'] ?? DEFAULT_AURA_RATES.rate_box_truck),
      base_radius:    Number(tenantRates['local_base_radius_miles']  ?? DEFAULT_AURA_RATES.base_radius),
    };

    const dMiles   = parseFloat(body.distanceMiles) || 0;
    const wLbs     = parseFloat(body.weightLbs)     || 0;
    const pCount   = parseInt(body.palletCount)     || 1;
    const isPallet = body.cargoType === 'pallets';
    let subtotal   = 0;

    if (isPallet) {
      const palletCargoVan1 = Number(tenantRates['local_pallet_cargo_van_1'] ?? 95);
      const palletCargoVan2 = Number(tenantRates['local_pallet_cargo_van_2'] ?? 125);
      const boxTruckRates: Record<number, number> = { 3: 195, 4: 250, 5: 300, 6: 350 };
      const isBoxTruck = pCount >= 3;
      subtotal = isBoxTruck
        ? Number(tenantRates[`local_pallet_box_truck_${pCount}`] ?? boxTruckRates[pCount] ?? 195)
        : (pCount === 2 ? palletCargoVan2 : palletCargoVan1);
      if (dMiles > auraRates.base_radius) {
        const ratePerMile = isBoxTruck ? auraRates.rate_box_truck : auraRates.rate_cargo_van;
        subtotal += parseFloat(((dMiles - auraRates.base_radius) * ratePerMile).toFixed(2));
      }
    } else {
      if (wLbs <= 0) return NextResponse.json({ message: 'Peso inválido' }, { status: 400 });
      const aura = calculateAuraLocalDelivery([{ length: 1, width: 1, height: 1, realWeight: wLbs }], dMiles, auraRates);
      subtotal = aura.totalFare;
    }

    const processingFee = getProcessingFee(subtotal);
    const totalPaid     = parseFloat((subtotal + processingFee).toFixed(2));
    const amountCents   = Math.round(totalPaid * 100);
    if (amountCents < 50) return NextResponse.json({ message: 'El monto mínimo es $0.50' }, { status: 400 });

    const stripe = await getTenantStripe(tenantSlug);
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true, name: true, email: true, stripeCustomerId: true } });
    let customerId = dbUser?.stripeCustomerId;
    if (!customerId) {
      const existing = await stripe.customers.list({ email: user.email, limit: 1 });
      customerId = existing.data.length > 0 ? existing.data[0].id : (await stripe.customers.create({ email: user.email, name: dbUser?.name || 'Cliente GMC' })).id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    }
    const ephemeralKey = await stripe.ephemeralKeys.create({ customer: customerId }, { apiVersion: '2023-10-16' });
    const stopsSummary = Array.isArray(body.extraStops) ? body.extraStops.map((s: any) => s.address).join(' → ') : (body.extraStops ?? '');
    const pi = await stripe.paymentIntents.create({
      amount: amountCents, currency: 'usd', customer: customerId,
      description: `GMC Local Delivery — ${isPallet ? `${pCount} pallet(s)` : `${wLbs} lbs`}`,
      metadata: {
        userId: user.id, serviceType: 'DELIVERY', cargoType: body.cargoType ?? '',
        weightTier: body.weightTier ?? '', weightLbs: String(wLbs), palletCount: String(pCount),
        vehicleType: body.vehicleType ?? '', distanceMiles: String(dMiles),
        subtotal: String(subtotal), processingFee: String(processingFee), totalPaid: String(totalPaid),
        pickupDate: body.pickupDate ?? '', pickupTime: body.pickupTime ?? '',
        contactName: body.contactName ?? '', contactPhone: body.contactPhone ?? '',
        notes: (body.notes ?? '').slice(0, 500),
        extraStops: JSON.stringify(body.extraStops ?? []).slice(0, 500),
        stopsSummary: stopsSummary.slice(0, 500),
      },
    });
    return NextResponse.json({ clientSecret: pi.client_secret, ephemeralKey: ephemeralKey.secret, customerId, paymentIntentId: pi.id, subtotal, processingFee, totalPaid });
  } catch (error: any) {
    console.error('[pickup/checkout-mobile]', error);
    return NextResponse.json({ message: error.message || 'Error interno' }, { status: 500 });
  }
}
