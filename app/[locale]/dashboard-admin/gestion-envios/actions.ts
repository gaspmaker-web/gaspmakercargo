'use server'

// ❌ NO IMPORTAMOS PRISMA AQUÍ ARRIBA.
// Esto evita que Vercel intente conectarse durante el Build y falle.

export async function obtenerDespachos() {
  try {
    // ✅ IMPORTACIÓN PEREZOSA (LAZY LOAD)
    // Solo cargamos la librería de base de datos cuando la función se ejecuta realmente.
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

    return { 
        success: true, 
        data: { consolidaciones, paquetes } 
    };

  } catch (error) {
    console.error("Error (Ignorado durante Build):", error);
    // Si falla la conexión (como pasa en el Build de Vercel), devolvemos arrays vacíos
    // y ASÍ EL BUILD PASA A VERDE 🟢.
    return { 
        success: false, 
        data: { consolidaciones: [], paquetes: [] } 
    };
  }
}