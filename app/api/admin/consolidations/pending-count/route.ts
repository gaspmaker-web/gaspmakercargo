import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // 🔥 Importante: No guardar caché

export async function GET() {
  try {
    // Buscamos en la base de datos cuántas dicen 'SOLICITADO'
    const count = await prisma.consolidationRequest.count({
      where: {
        status: 'SOLICITADO' 
      }
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error contando consolidaciones:", error);
    return NextResponse.json({ count: 0 });
  }
}