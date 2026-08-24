import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const session = await auth();
    if (!session || (session.user as any).role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = (await import('@/lib/prisma')).default;
    const { shipmentId, staffName } = await req.json();

    try {
        const shipment = await prisma.consolidatedShipment.findUnique({
            where: { id: shipmentId },
            include: { packages: true, user: true }
        });

        if (!shipment) {
            return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
        }

        const cashPaymentId = `CASH-${Date.now()}`;

        // Marcar shipment como PAGADO y ENTREGADO en un solo paso
        await prisma.consolidatedShipment.update({
            where: { id: shipmentId },
            data: {
                status: 'ENTREGADO',
                paymentId: cashPaymentId,
                deliveredBy: staffName || 'Staff',
            }
        });

        // Actualizar todos los paquetes
        await prisma.package.updateMany({
            where: { consolidatedShipmentId: shipmentId },
            data: {
                status: 'ENTREGADO',
                shippingTotalPaid: shipment.totalAmount || 0,
                stripePaymentId: cashPaymentId,
                deliveredBy: staffName || 'Staff',
                deliverySignature: 'ENTREGA_TIENDA',
            }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Cash payment error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}