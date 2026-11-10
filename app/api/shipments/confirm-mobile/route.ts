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
    if (!user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const { paymentIntentId, packageIds, selectedCourier, courierService, totalPaid, easypostRateId, easypostShipmentId, shippingAddressId, serviceType } = body;

    if (!paymentIntentId || !packageIds?.length) return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });

    const stripe = await getTenantStripe(process.env.TENANT_SLUG || 'gaspmaker');
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== 'succeeded') return NextResponse.json({ error: 'Pago no completado' }, { status: 400 });

    const typeMap: Record<string, string> = { AERIAL: 'CONSOLIDATION', OCEAN: 'OCEAN_CONSOLIDATION', LOCAL: 'LOCAL_DELIVERY' };

    let shippingAddressStr = '';
    if (shippingAddressId) {
      const addr = await prisma.shippingAddress.findUnique({ where: { id: shippingAddressId } });
      if (addr) shippingAddressStr = `${addr.fullName} | ${addr.address}, ${addr.cityZip || addr.city}, ${addr.country} | Tel: ${addr.phone || 'N/A'}`;
    }

    const shipment = await prisma.consolidatedShipment.create({
      data: {
        userId: user.id, serviceType: typeMap[serviceType] || 'CONSOLIDATION', status: 'PAGADO',
        paymentId: paymentIntentId, selectedCourier: selectedCourier || null, courierService: courierService || null,
        totalAmount: Number(totalPaid), shippingAddress: shippingAddressStr || null,
        easypostRateId: easypostRateId || null, easypostShipmentId: easypostShipmentId || null,
        packages: { connect: packageIds.map((id: string) => ({ id })) },
      },
    });

    await prisma.package.updateMany({
      where: { id: { in: packageIds } },
      data: { status: 'LISTO_PARA_ENVIO', stripePaymentId: paymentIntentId, shippingAddress: shippingAddressStr || null, shippingTotalPaid: Number(totalPaid) / packageIds.length, selectedCourier: selectedCourier || null, courierService: courierService || null, easypostRateId: easypostRateId || null, easypostShipmentId: easypostShipmentId || null },
    });

    return NextResponse.json({ success: true, shipmentId: shipment.id });
  } catch (error: any) {
    console.error('[shipments/confirm-mobile]', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
