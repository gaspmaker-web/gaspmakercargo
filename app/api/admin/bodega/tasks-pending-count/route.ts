import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // ⚠️ Ajusta la ruta a tu cliente de Prisma si es diferente

export const dynamic = 'force-dynamic'; // Evita que Next.js cachee esta respuesta

export async function GET(req: Request) {
  try {
    // 1. Calculamos la fecha exacta de hace 30 días
    // Todo sobre que haya llegado ANTES de esta fecha, ya expiró.
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 2. Buscamos todas las tareas pendientes combinadas
    const pendingTasksCount = await prisma.mailItem.count({
      where: {
        OR: [
          // CONDICIÓN A: El cliente solicitó una acción específica
          {
            status: {
              in: ['SCAN_REQUESTED', 'SHRED_REQUESTED', 'MOVED_TO_CARGO']
            }
          },
          // CONDICIÓN B: Notificación de Expiración (Cumplió 30 días)
          {
            receivedAt: {
              lte: thirtyDaysAgo // "lte" significa Menor o Igual (Llegó hace 30 días o más)
            },
            status: {
              in: ['UNREAD', 'SCANNED_READY'] // Solo nos importan los que siguen en bodega sin acciones previas
            }
          }
        ]
      }
    });

    return NextResponse.json({ count: pendingTasksCount }, { status: 200 });

  } catch (error) {
    console.error("Error consultando Prisma en tasks-pending-count (Bodega):", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}