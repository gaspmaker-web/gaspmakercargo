import { NextResponse } from 'next/server';

// 🛡️ OBLIGATORIO: Forzamos a que esta ruta sea dinámica
// Esto evita que Vercel intente ejecutarla durante el proceso de Build
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // ✅ IMPORTACIÓN PEREZOSA (LAZY LOAD)
    // Solo cargamos la conexión a la BD cuando la API se ejecuta realmente, no en el build.
    const { default: prisma } = await import('@/lib/prisma');

    // Fechas auxiliares para los cálculos
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const haceSieteDias = new Date();
    haceSieteDias.setDate(haceSieteDias.getDate() - 7);

    // Ejecutamos todas las consultas en paralelo (Promise.all) para que sea súper rápido
    const [
      paquetesActivos,
      clientesTotal,
      consolidacionesPendientes,
      pickupsPendientes,
      ventasData,
      entregasHoy,
      nuevosClientes
    ] = await Promise.all([
      // 1. Paquetes Activos
      prisma.package.count({
        where: { status: { not: 'ENTREGADO' } }
      }),
      // 2. Total Clientes
      prisma.user.count({
        where: { role: 'CLIENTE' }
      }),
      // 3. Consolidaciones Pendientes (Tu lógica compleja)
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
      // 4. Pickups Pendientes
      prisma.pickupRequest.count({
        where: { status: 'PAGADO' }
      }),
      // 5. Ventas de la semana
      prisma.consolidatedShipment.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: haceSieteDias } }
      }),
      // 6. Entregas de Hoy
      prisma.pickupRequest.count({
        where: { 
            status: 'ENTREGADO',
            updatedAt: { gte: hoy }
        }
      }),
      // 7. Nuevos Clientes (Semana)
      prisma.user.count({
        where: { 
            role: 'CLIENTE',
            createdAt: { gte: haceSieteDias }
        }
      })
    ]);

    // Devolvemos los datos en formato JSON para el Cliente
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
    console.error("Error API Stats:", error);
    // En caso de error (o durante build si pasara algo raro), devolvemos ceros para no romper nada
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