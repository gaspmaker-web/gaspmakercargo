import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'; 

export async function GET() {
  try {
    // CORRECCIÓN: Usamos 'consolidatedShipment' que es el nombre real en tu Schema
    const count = await prisma.consolidatedShipment.count({
      where: {
        // Asumimos que el estado inicial cuando el cliente pide consolidar es 'SOLICITADO'
        status: 'SOLICITADO' 
      }
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error contando consolidaciones:", error);
    return NextResponse.json({ count: 0 });
  }
}