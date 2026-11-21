// app/api/pickup/confirm-mobile/route.ts
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';
import { getTenantStripe } from '@/lib/tenant-stripe';
import { sendPaymentReceiptEmail, sendAdminPaymentAlert, sendNotification } from '@/lib/notifications';

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

    const { paymentIntentId } = await req.json();
    if (!paymentIntentId) return NextResponse.json({ message: 'paymentIntentId requerido' }, { status: 400 });

    const tenantSlug = process.env.TENANT_SLUG || 'gaspmaker';
    const stripe     = await getTenantStripe(tenantSlug);
    const pi         = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (pi.status !== 'succeeded') return NextResponse.json({ message: `Pago no completado: ${pi.status}` }, { status: 402 });
    if (pi.metadata?.userId !== user.id) return NextResponse.json({ message: 'No autorizado' }, { status: 403 });

    const existing = await prisma.pickupRequest.findFirst({ where: { stripePaymentId: paymentIntentId } });
    if (existing) return NextResponse.json({ success: true, message: 'Ya confirmado', data: existing });

    const m             = pi.metadata;
    const totalPaid     = parseFloat(m.totalPaid     || '0');
    const subtotal      = parseFloat(m.subtotal      || '0');
    const processingFee = parseFloat(m.processingFee || '0');
    const distanceMiles = parseFloat(m.distanceMiles || '0') || null;
    const weightLbs     = parseFloat(m.weightLbs     || '0') || null;
    const isPallet      = m.cargoType === 'pallets';
    const extraStops    = m.extraStops ? JSON.parse(m.extraStops) : [];
    const pickupStop    = extraStops.find((s: any) => s.type === 'PICKUP');
    const dropoffStop   = extraStops.find((s: any) => s.type === 'DROPOFF');

    const geocode = async (address: string) => {
      if (!address) return null;
      const res  = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`);
      const data = await res.json();
      return data.status === 'OK' && data.results[0] ? data.results[0].geometry.location as { lat: number; lng: number } : null;
    };

    const originCoords = await geocode(pickupStop?.address  || '');
    const destCoords   = await geocode(dropoffStop?.address || '');
    const pickupDate   = m.pickupDate ? new Date(m.pickupDate) : new Date();

    const newRequest = await prisma.pickupRequest.create({
      data: {
        userId: user.id, serviceType: 'DELIVERY',
        originAddress:  pickupStop?.address  || '',
        dropOffAddress: dropoffStop?.address || null,
        dropOffContact: dropoffStop?.contact || null,
        dropOffPhone:   dropoffStop?.phone   || null,
        pickupDate, contactPhone: m.contactPhone || '',
        description: m.notes || null, weightInfo: m.weightTier || null,
        weightLbs, distanceMiles, isPalletMode: isPallet,
        extraStops, lat: originCoords?.lat ?? null, lng: originCoords?.lng ?? null,
        latDest: destCoords?.lat ?? null, lngDest: destCoords?.lng ?? null,
        status: 'PAGADO', totalPaid, subtotal, processingFee,
        stripePaymentId: paymentIntentId,
        pickupPin: Math.floor(1000 + Math.random() * 9000).toString(),
      },
    });

    try {
      await sendPaymentReceiptEmail(user.email, user.name || 'Cliente', 'Local Delivery', totalPaid, newRequest.id, `Ruta: ${pickupStop?.address ?? ''} → ${dropoffStop?.address ?? ''}`);
      await sendAdminPaymentAlert(user.name || 'Cliente', totalPaid, 'Local Delivery (Mobile)', newRequest.id);
      await sendNotification({ userId: user.id, title: JSON.stringify({ key: 'pickupConfirmedTitle' }), message: JSON.stringify({ key: 'pickupConfirmedBody', date: pickupDate.toLocaleDateString() }), type: 'SUCCESS' });
    } catch (e) { console.error('[pickup/confirm-mobile] notification error:', e); }

    return NextResponse.json({ success: true, message: 'Solicitud confirmada', data: newRequest }, { status: 201 });
  } catch (error: any) {
    console.error('[pickup/confirm-mobile]', error);
    return NextResponse.json({ message: error.message || 'Error interno' }, { status: 500 });
  }
}
