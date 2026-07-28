import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { getTenant } = await import('@/lib/tenant');
    const tenant = await getTenant();

    // Últimos paquetes creados
    const recentPackages = await prisma.package.findMany({
      where: { tenant_id: tenant?.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        gmcTrackingNumber: true,
        createdAt: true,
        user: { select: { name: true } }
      }
    });

    // Últimas consolidaciones
    const recentConsolidations = await prisma.consolidatedShipment.findMany({
      where: { tenant_id: tenant?.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        gmcShipmentNumber: true,
        createdAt: true,
        status: true,
        serviceType: true,
      }
    });

    // Combinar y ordenar por fecha
    const activities = [
      ...recentPackages.map(p => ({
        id: p.id,
        type: 'PACKAGE',
        title: `Paquete creado — ${p.gmcTrackingNumber}`,
        subtitle: p.user?.name || 'Cliente',
        date: p.createdAt,
        color: 'blue',
      })),
      ...recentConsolidations.map(c => ({
        id: c.id,
        type: 'CONSOLIDATION',
        title: `Consolidación ${c.serviceType || ''} — ${c.gmcShipmentNumber}`,
        subtitle: c.status || '',
        date: c.createdAt,
        color: 'purple',
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
     .slice(0, 10);

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Error loading activity:', error);
    return NextResponse.json({ activities: [] });
  }
}