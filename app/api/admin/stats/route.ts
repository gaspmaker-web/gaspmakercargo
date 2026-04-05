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
      nuevosClientes,
      tareasBuzonPendientes,
      kycTitularesPendientes,
      kycAdicionalesPendientes,
      sobresFisicosRaw,
      shopperPorCotizar,
      shopperPagados,
      // 🔥 NUEVA CONSULTA: Citas de Recogida Física (Buzón)
      pickupsBuzonPendientes
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
      }),
      prisma.mailItem.count({
        where: { status: { in: ['SCAN_REQUESTED', 'SHRED_REQUESTED', 'CARGO_REQUESTED'] } }
      }),
      prisma.mailboxSubscription.count({
        where: { status: 'PENDING_USPS' }
      }),
      prisma.additionalRecipient.count({
        where: { status: 'PENDING_USPS' }
      }),
      prisma.mailItem.findMany({
        where: { status: { in: ['UNREAD', 'SCANNED_READY'] } },
        include: { user: { include: { mailboxSubscription: true } } }
      }),
      prisma.shopperOrder.count({
        where: { status: 'PENDING_QUOTE' }
      }),
      prisma.shopperOrder.count({
        where: { status: 'PAID' }
      }),
      // 🔥 Cuenta las citas que están esperando ser entregadas en el mostrador
      prisma.mailPickupRequest.count({
        where: { status: { in: ['PENDING', 'READY'] } }
      })
    ]);

    // LÓGICA DE CADUCADOS
    const now = new Date();
    let caducadosCount = 0;

    sobresFisicosRaw.forEach(item => {
      const sub = item.user?.mailboxSubscription;
      const isPremium = sub?.planType === 'PREMIUM_1499' || sub?.planType === 'Premium Cargo' || sub?.planType === 'PREMIUM';
      const maxDays = isPremium ? 60 : 30;
      
      const diffInMs = now.getTime() - new Date(item.receivedAt).getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      
      if (diffInDays >= maxDays) {
        caducadosCount++;
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        paquetes: paquetesActivos,
        usuarios: clientesTotal,
        consolidaciones: consolidacionesPendientes,
        pickups: pickupsPendientes,
        ventas: ventasData._sum.totalAmount || 0,
        entregasHoy: entregasHoy,
        nuevosClientes: nuevosClientes,
        tareasBuzon: tareasBuzonPendientes,
        kycPendientes: kycTitularesPendientes + kycAdicionalesPendientes,
        caducados: caducadosCount,
        comprasPendientes: shopperPorCotizar + shopperPagados,
        // 🔥 ENVIAMOS EL CONTADOR AL FRONTEND
        pickupsBuzon: pickupsBuzonPendientes 
      }
    });

  } catch (error) {
    console.error("Error en stats API:", error);
    return NextResponse.json({
      success: false,
      stats: {
        paquetes: 0,
        usuarios: 0,
        consolidaciones: 0,
        pickups: 0,
        ventas: 0,
        entregasHoy: 0,
        nuevosClientes: 0,
        tareasBuzon: 0,     
        kycPendientes: 0,   
        caducados: 0,
        comprasPendientes: 0,
        pickupsBuzon: 0
      }
    }, { status: 500 });
  }
}