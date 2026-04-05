import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // ⚠️ Asegúrate de que la ruta a Prisma sea correcta

export const dynamic = 'force-dynamic'; // Evita que Next.js cachee esta respuesta

export async function GET(req: Request) {
  try {
    // 1. Calculamos el inicio del día de HOY (00:00:00)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // 2. Contamos cuántos sobres (MailItems) se han registrado en el sistema desde que empezó el día
    const todayReceptionCount = await prisma.mailItem.count({
      where: {
        createdAt: {
          gte: startOfDay // gte significa "Greater Than or Equal" (Mayor o igual a hoy a la medianoche)
        }
      }
    });

    return NextResponse.json({ count: todayReceptionCount }, { status: 200 });

  } catch (error) {
    console.error("Error consultando Prisma en reception-pending-count (Bodega):", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}