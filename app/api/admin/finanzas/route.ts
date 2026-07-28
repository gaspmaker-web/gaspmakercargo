import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { getTenant } = await import('@/lib/tenant');
    const tenant = await getTenant();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const type = searchParams.get('type') || 'all';
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    const [packages, consolidations, pickups, mailboxTxs] = await Promise.all([
      type === 'all' || type === 'package' ? prisma.package.findMany({
        where: {
          consolidatedShipmentId: null,
          tenant_id: tenant?.id,
          ...(search ? { user: { name: { contains: search, mode: 'insensitive' } } } : {}),
        },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } }
      }) : Promise.resolve([]),

      type === 'all' || type === 'consolidation' ? prisma.consolidatedShipment.findMany({
        where: {
          tenant_id: tenant?.id,
          ...(search ? { user: { name: { contains: search, mode: 'insensitive' } } } : {}),
        },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } }
      }) : Promise.resolve([]),

      type === 'all' || type === 'pickup' ? prisma.pickupRequest.findMany({
        where: {
          ...(search ? { user: { name: { contains: search, mode: 'insensitive' } } } : {}),
        },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } }
      }) : Promise.resolve([]),

      type === 'all' || type === 'mailbox' ? prisma.mailboxTransaction.findMany({
        where: {
          ...(search ? { user: { name: { contains: search, mode: 'insensitive' } } } : {}),
        },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } }
      }) : Promise.resolve([]),
    ]);

  const all = [
      ...packages.map(p => ({
        id: p.gmcTrackingNumber,
        type: 'Paquete',
        date: p.createdAt,
        amount: p.shippingTotalPaid || 0,
        debt: (() => {
          const msPerDay = 1000 * 60 * 60 * 24;
          const daysInWarehouse = Math.floor((new Date().getTime() - new Date(p.createdAt).getTime()) / msPerDay);
          let storageDebt = p.storageDebt || 0;
          const isDelivered = ['ENTREGADO', 'DELIVERED', 'COMPLETADO', 'ENVIADO', 'SHIPPED'].includes(p.status);
          if (storageDebt === 0 && daysInWarehouse > 30 && !isDelivered) {
            const volumeFt3 = ((p.lengthIn || 10) * (p.widthIn || 10) * (p.heightIn || 10)) / 1728;
            const monthsOverdue = Math.ceil((daysInWarehouse - 30) / 30);
            storageDebt = monthsOverdue * 2.25 * volumeFt3;
          }
          return Math.max(0, storageDebt + ((p.shippingSubtotal || 0) - (p.shippingTotalPaid || 0)));
        })(),
        status: p.status,
        client: p.user.name || p.user.email,
        description: null,
      })),
      ...consolidations.map(c => ({
        id: c.gmcShipmentNumber,
        type: 'Consolidación',
        date: c.createdAt,
        amount: c.totalAmount || 0,
        debt: 0,
        status: c.status,
        client: c.user.name || c.user.email,
        description: null,
      })),
      ...pickups.map(pk => ({
        id: pk.id.substring(0, 8).toUpperCase(),
        type: pk.serviceType === 'STORAGE' ? 'Almacenaje' : 'Pickup',
        date: pk.createdAt,
        amount: pk.totalPaid || 0,
        debt: Math.max(0, (pk.subtotal || 0) - (pk.totalPaid || 0)),
        status: pk.status,
        client: pk.user?.name || pk.user?.email || 'N/A',
        description: null,
      })),
      ...mailboxTxs.map(tx => ({
        id: tx.stripePaymentId ? `STRIPE-${tx.stripePaymentId.substring(0, 8)}` : `TX-${tx.id.substring(0, 6).toUpperCase()}`,
        type: 'Buzón Virtual',
        date: tx.createdAt,
        amount: tx.amount,
        debt: 0,
        status: tx.status,
        client: tx.user?.name || tx.user?.email || 'N/A',
        description: tx.description,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const total = all.length;
    const paginated = all.slice(skip, skip + limit);

    // Calcular totales según el filtro activo
    const totalCarga = all.filter(t => t.type === 'Paquete' || t.type === 'Consolidación').reduce((s, t) => s + t.amount, 0);
    const totalPickups = all.filter(t => t.type === 'Pickup' || t.type === 'Almacenaje').reduce((s, t) => s + t.amount, 0);
    const totalBuzon = all.filter(t => t.type === 'Buzón Virtual').reduce((s, t) => s + t.amount, 0);
    const totalDeuda = all.reduce((s, t) => s + t.debt, 0);

    return NextResponse.json({ 
      transactions: paginated, 
      total,
      page,
      totalPages: Math.ceil(total / limit),
      totals: {
        carga: totalCarga,
        pickups: totalPickups,
        buzon: totalBuzon,
        deuda: totalDeuda,
      }
    });

  } catch (error) {
    console.error('Error loading finanzas:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}