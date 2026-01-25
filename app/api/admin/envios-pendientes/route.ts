import { NextResponse } from 'next/server';

// Forzamos a que esta API sea dinámica siempre
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Importación perezosa de Prisma
    const { default: prisma } = await import('@/lib/prisma');

    // 1. Buscamos Consolidaciones
    const consolidaciones = await prisma.consolidatedShipment.findMany({
      where: { status: 'POR_ENVIAR' }, 
      include: { user: true, packages: true },
      orderBy: { updatedAt: 'asc' }
    });

    // 2. Buscamos Paquetes Sueltos
    const paquetes = await prisma.package.findMany({
      where: { status: 'POR_ENVIAR', consolidatedShipmentId: null },
      include: { user: true },
      orderBy: { updatedAt: 'asc' }
    });

    return NextResponse.json({ 
        success: true, 
        data: { consolidaciones, paquetes } 
    });

  } catch (error) {
    console.error("Error API Envios:", error);
    // En caso de error (o durante el build si algo raro pasara), devolvemos arrays vacíos
    return NextResponse.json({ 
        success: false, 
        data: { consolidaciones: [], paquetes: [] } 
    }, { status: 500 });
  }
}