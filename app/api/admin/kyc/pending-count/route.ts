import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Contamos cuántos titulares principales están pendientes
    const primaryCount = await prisma.mailboxSubscription.count({
      where: { status: 'PENDING_USPS' }
    });

    // 2. Contamos cuántos usuarios adicionales (socios/familiares) están pendientes
    const additionalCount = await prisma.additionalRecipient.count({
      where: { status: 'PENDING_USPS' }
    });

    // 3. Sumamos ambos valores para obtener el total real
    const totalPending = primaryCount + additionalCount;

    return NextResponse.json({ count: totalPending }, { status: 200 });

  } catch (error) {
    console.error("Error obteniendo conteo de KYC:", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}