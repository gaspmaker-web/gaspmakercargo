import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await auth();
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const prisma = (await import('@/lib/prisma')).default;
    const { shipmentId } = await req.json();
    if (!shipmentId) return NextResponse.json({ error: 'shipmentId requerido' }, { status: 400 });

    const shipment = await prisma.consolidatedShipment.findUnique({
      where: { id: shipmentId },
      include: { packages: { select: { id: true } } }
    });

    if (!shipment) return NextResponse.json({ error: 'Shipment no encontrado' }, { status: 404 });

    const undoableStatuses = ['PENDIENTE_PAGO', 'PENDIENTE', 'PAGADO', 'LISTO_PARA_ENVIO', 'CREATED'];
    if (!undoableStatuses.includes(shipment.status)) {
      return NextResponse.json({ error: `No se puede deshacer un envío con status "${shipment.status}"` }, { status: 400 });
    }

    const packageIds = shipment.packages.map((p: any) => p.id);

    await prisma.$transaction([
      // Liberar paquetes — quitar consolidación y volver a disponible
      prisma.package.updateMany({
        where: { id: { in: packageIds } },
        data: { consolidatedShipmentId: null, status: 'EN_ALMACEN', storageDebt: 0, storagePaidUntil: new Date() },
      }),
      // Cancelar el shipment
      prisma.consolidatedShipment.update({
        where: { id: shipmentId },
        data: { status: 'CANCELADO' },
      }),
    ]);

    // Notificar cliente
    try {
      const { sendNotification } = await import('@/lib/notifications');
      await sendNotification({
        userId: shipment.userId,
        title: '❌ Envío Cancelado',
        message: `Tu envío ${shipment.gmcShipmentNumber} fue cancelado. Los paquetes están de nuevo disponibles en almacén.`,
        type: 'INFO',
        href: '/dashboard-cliente',
      });
    } catch {}

    return NextResponse.json({ success: true, packagesReleased: packageIds.length });

  } catch (err: any) {
    console.error('[consolidations/undo]', err);
    return NextResponse.json({ error: 'Error interno: ' + err.message }, { status: 500 });
  }
}
