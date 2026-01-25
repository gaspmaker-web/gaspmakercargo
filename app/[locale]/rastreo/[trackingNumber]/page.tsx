import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import TrackingClient from './TrackingClient';

// 🛡️ ESCUDO: Forzamos dinámico para evitar errores de compilación estática
export const dynamic = 'force-dynamic';

export default async function TrackingPage({ 
  params, 
  searchParams 
}: { 
  params: { trackingNumber: string },
  searchParams?: { from?: string } 
}) {
  const { trackingNumber } = params;

  // 1. Buscar el paquete por su Tracking Number (GMC)
  const pkg = await prisma.package.findFirst({
    where: { gmcTrackingNumber: trackingNumber },
    include: { user: true }
  });

  if (!pkg) return notFound(); 

  // ⚠️ IMPORTANTE: Convertimos fechas a string para evitar advertencias de React
  // "Warning: Only plain objects can be passed to Client Components"
  const serializedPkg = JSON.parse(JSON.stringify(pkg));

  return (
    <TrackingClient 
      pkg={serializedPkg} 
      from={searchParams?.from} 
    />
  );
}