import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { auth } = await import('@/auth');
    const { default: prisma } = await import('@/lib/prisma');
    const { getTenant } = await import('@/lib/tenant');

    // 1. PRIMERO verificar sesión
    const session = await auth();
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE')) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    // 2. DESPUÉS obtener tenant y hacer queries
    const tenant = await getTenant();
    const tenantFilter = tenant?.id ? { tenant_id: tenant.id } : {};

    const consolidaciones = await prisma.consolidatedShipment.findMany({
      where: { status: 'POR_ENVIAR', ...tenantFilter }, 
      include: { user: true, packages: true },
      orderBy: { updatedAt: 'asc' }
    });

    const paquetes = await prisma.package.findMany({
      where: { status: 'POR_ENVIAR', consolidatedShipmentId: null, ...tenantFilter },
      include: { user: true },
      orderBy: { updatedAt: 'asc' }
    });

    return NextResponse.json({ 
        success: true, 
        data: { consolidaciones, paquetes } 
    });

  } catch (error) {
    console.error("Error API Envios:", error);
    return NextResponse.json({ 
        success: false, 
        data: { consolidaciones: [], paquetes: [] } 
    }, { status: 500 });
  }
}