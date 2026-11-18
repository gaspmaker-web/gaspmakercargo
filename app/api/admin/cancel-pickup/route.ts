import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { auth } = await import('@/auth');
    const prisma = (await import('@/lib/prisma')).default;

    const session = await auth();
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { pickupId, refund = false } = await req.json();
    if (!pickupId) return NextResponse.json({ error: 'pickupId requerido' }, { status: 400 });

    const pickup = await prisma.pickupRequest.findUnique({ where: { id: pickupId } });
    if (!pickup) return NextResponse.json({ error: 'Pickup no encontrado' }, { status: 404 });

    if (['CANCELADO', 'PROCESADO', 'COMPLETADO', 'ENTREGADO'].includes(pickup.status)) {
      return NextResponse.json({ error: `No se puede cancelar un pickup con status "${pickup.status}"` }, { status: 400 });
    }

    let refundId = null;

    if (refund && pickup.stripePaymentId && (pickup.totalPaid || 0) > 0) {
      try {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' as any });
        const pi = await stripe.paymentIntents.retrieve(pickup.stripePaymentId);
        if (pi.status === 'succeeded') {
          const ref = await stripe.refunds.create({ payment_intent: pickup.stripePaymentId });
          refundId = ref.id;
        }
      } catch (e: any) {
        return NextResponse.json({ error: 'Error procesando refund: ' + e.message }, { status: 500 });
      }
    }

    await prisma.pickupRequest.update({
      where: { id: pickupId },
      data: { status: 'CANCELADO' },
    });

    try {
      const { sendNotification } = await import('@/lib/notifications');
      await sendNotification({
        userId: pickup.userId,
        title: '❌ Pickup Cancelado',
        message: `Tu pickup #${pickupId.slice(0, 6).toUpperCase()} ha sido cancelado${refundId ? ' y el pago fue reembolsado' : ''}.`,
        type: 'INFO',
        href: '/dashboard-cliente',
      });
    } catch {}

    return NextResponse.json({ success: true, refundId });

  } catch (err: any) {
    console.error('[admin/cancel-pickup]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
