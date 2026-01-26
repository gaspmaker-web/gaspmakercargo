import prisma from '@/lib/prisma'; // ✅ REACTIVADO
import { notFound } from 'next/navigation';
import TrackingClient from './TrackingClient';

// 🟢 EL SECRETO: Esto arregla el error de Vercel sin desconectar la BD
// Le dice a Next.js: "No intentes construir esto estáticamente, hazlo al momento de la visita"
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TrackingPage({ 
  params, 
  searchParams 
}: { 
  params: { trackingNumber: string },
  searchParams?: { from?: string } 
}) {
  const { trackingNumber } = params;
  let pkg;

  try {
    // 1. Buscamos el paquete REAL en la base de datos
    // Usamos findFirst para buscar por el Tracking de GMC
    const pkgData = await prisma.package.findFirst({
      where: { gmcTrackingNumber: trackingNumber },
      include: {
        user: {
            select: {
                name: true,
                country: true,
                suiteNo: true,
                countryCode: true
            }
        }
      }
    });

    // 2. Si no existe, mandamos a página 404
    if (!pkgData) {
      return notFound();
    }

    // 3. Serializamos las fechas (Truco vital para evitar errores de "Date object" entre Servidor y Cliente)
    pkg = JSON.parse(JSON.stringify(pkgData));

  } catch (error) {
    console.error("⚠️ Error conectando a BD en Rastreo:", error);
    // Si la base de datos falla, mostramos 404 en vez de romper la página entera
    return notFound();
  }

  return (
    <TrackingClient 
      pkg={pkg} 
      from={searchParams?.from} 
    />
  );
}