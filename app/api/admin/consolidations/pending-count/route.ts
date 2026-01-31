import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 🔥 CAMBIO: Buscamos varios nombres posibles para asegurarnos de encontrarlo
    const count = await prisma.consolidatedShipment.count({
      where: {
        status: {
          in: ['SOLICITADO', 'PENDIENTE', 'PENDING', 'CREATED', 'En Proceso']
        }
      }
    });

    console.log("🔴 Conteo de consolidaciones pendientes:", count); // Para ver en la terminal si funciona
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error contando consolidaciones:", error);
    return NextResponse.json({ count: 0 });
  }
}