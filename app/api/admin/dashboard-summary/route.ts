import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 🔥 ARQUITECTURA ENTERPRISE: Caché Ligero
// Actualiza estos contadores cada 60 segundos. 
export const revalidate = 60;

export async function GET() {
  try {
    // 🔥 EJECUCIÓN PARALELA: Basada 100% en tu schema.prisma
    const [paidCount, prealertsCount, receptionPendingCount] = await Promise.all([
      // 1. Paquetes o consolidaciones pagadas (Asumo que buscas PickupRequests o ConsolidatedShipments pagados)
      prisma.pickupRequest.count({ 
        where: { status: 'PAGADO' } 
      }),
      
      // 2. Prealertas (Paquetes en estado PRE_ALERTADO)
      prisma.package.count({ 
        where: { status: 'PRE_ALERTADO' } 
      }),
      
      // 3. Recepciones pendientes (Paquetes que vienen en camino)
      prisma.package.count({ 
        where: { status: 'PENDING' } 
      })
    ]);

    return NextResponse.json({
      success: true,
      paidCount,
      prealertsCount,
      receptionPendingCount
    });

  } catch (error) {
    console.error("Error en dashboard-summary API:", error);
    return NextResponse.json({
      success: false,
      paidCount: 0,
      prealertsCount: 0,
      receptionPendingCount: 0
    }, { status: 500 });
  }
}