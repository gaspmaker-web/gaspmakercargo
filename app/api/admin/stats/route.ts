import { NextResponse } from 'next/server';

// 🔥 ARQUITECTURA ENTERPRISE: Caché de Segmento
// Reemplazamos 'force-dynamic' por 'revalidate'. 
// Vercel calculará esta súper-consulta 1 vez y la guardará en memoria por 5 minutos (300 segundos).
// Si tu equipo entra 100 veces en esos 5 minutos, el costo de CPU será 0.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { default: prisma } = await import('@/lib/prisma');
    const { auth } = await import('@/auth');
const session = await auth();
if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
}

// 🏢 Tenant filter
const { getTenant } = await import('@/lib/tenant');
const tenant = await getTenant();
const tenantFilter = tenant?.id ? { tenant_id: tenant.id } : {};

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
      pickupsBuzonPendientes,
      // 🔥 NUEVA CONSULTA: Facturas de clientes subidas esperando precio
      facturasClientesPendientes
    ] = await Promise.all([
      prisma.package.count({
       where: { status: { not: 'ENTREGADO' }, ...tenantFilter }
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
    ],
    ...tenantFilter
}
      }),
      prisma.pickupRequest.count({
      where: { 
    status: 'PAGADO',
    serviceType: { not: 'STORAGE_FEE' },
    ...tenantFilter
}
      }),
      prisma.consolidatedShipment.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: haceSieteDias }, ...tenantFilter }
      }),
      prisma.pickupRequest.count({
     where: { 
    status: 'ENTREGADO',
    updatedAt: { gte: hoy },
    serviceType: { not: 'STORAGE_FEE' },
    ...tenantFilter
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
      prisma.mailPickupRequest.count({
        where: { status: { in: ['PENDING', 'READY'] } }
      }),
      // 🔥 Cuenta paquetes en Miami con factura, pero cuyo valor es 0
      prisma.package.count({
       where: {
    status: { in: ['RECIBIDO_MIAMI', 'EN_ALMACEN'] },
    invoiceUrl: { not: null },
    declaredValue: { equals: 0 },
    ...tenantFilter
}
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
        pickupsBuzon: pickupsBuzonPendientes,
        // 🔥 ENVIAMOS EL CONTADOR DE FACTURAS NUEVAS AL FRONTEND
        facturasClientes: facturasClientesPendientes 
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
        pickupsBuzon: 0,
        facturasClientes: 0 // Fallback seguro
      }
    }, { status: 500 });
  }
}