import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { default: prisma } = await import('@/lib/prisma');

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const haceSieteDias = new Date();
    haceSieteDias.setDate(haceSieteDias.getDate() - 7);

    const [
      paquetesActivos,
      clientesTotal,
      consolidacionesPendientes,
      pickupsPendientes,
      ventasData,
      entregasHoy,
      nuevosClientes
    ] = await Promise.all([
      prisma.package.count({
        where: { status: { not: 'ENTREGADO' } }
      }),
      prisma.user.count({
        where: { role: 'CLIENTE' }
      }),
      prisma.consolidatedShipment.count({
        where: { 
            serviceType: 'CONSOLIDATION',
            OR: [
                { status: 'SOLICITUD_CONSOLIDACION' },
                { status: 'EN_PROCESO_CONSOLIDACION' },
                { totalAmount: 0 }
            ]
        }
      }),
      prisma.pickupRequest.count({
        where: { 
            status: 'PAGADO',
            serviceType: { not: 'STORAGE_FEE' }
        }
      }),
      prisma.consolidatedShipment.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: haceSieteDias } }
      }),
      prisma.pickupRequest.count({
        where: { 
            status: 'ENTREGADO',
            updatedAt: { gte: hoy },
            serviceType: { not: 'STORAGE_FEE' }
        }
      }),
      prisma.user.count({
        where: { 
            role: 'CLIENTE',
            createdAt: { gte: haceSieteDias }
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        paquetes: paquetesActivos,
        usuarios: clientesTotal,
        consolidaciones: consolidacionesPendientes,
        pickups: pickupsPendientes,
        ventas: ventasData._sum.totalAmount || 0,
        entregasHoy: entregasHoy,
        nuevosClientes: nuevosClientes
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      stats: {
        paquetes: 0,
        usuarios: 0,
        consolidaciones: 0,
        pickups: 0,
        ventas: 0,
        entregasHoy: 0,
        nuevosClientes: 0
      }
    }, { status: 500 });
  }
}