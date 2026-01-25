'use server'

import prisma from '@/lib/prisma';

export async function obtenerDespachos() {
  try {
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

    return { 
        success: true, 
        data: { consolidaciones, paquetes } 
    };

  } catch (error) {
    console.error("Error al obtener despachos:", error);
    // En caso de error, devolvemos arrays vacíos para que no rompa el front
    return { 
        success: false, 
        data: { consolidaciones: [], paquetes: [] } 
    };
  }
}