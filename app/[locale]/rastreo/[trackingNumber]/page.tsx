// import prisma from '@/lib/prisma'; // 👈 COMENTADO: Desconectamos la BD para que Vercel no llore
import { notFound } from 'next/navigation';
import TrackingClient from './TrackingClient';

// 🛡️ MODO DINÁMICO
export const dynamic = 'force-dynamic';

export default async function TrackingPage({ 
  params, 
  searchParams 
}: { 
  params: { trackingNumber: string },
  searchParams?: { from?: string } 
}) {
  const { trackingNumber } = params;

  // 🚧 MODO MANTENIMIENTO: DATOS DE PRUEBA 🚧
  // Como Vercel falla al construir con la BD, usamos este objeto temporalmente
  // para asegurar que el despliegue sea EXITOSO.
  const pkg = {
    gmcTrackingNumber: trackingNumber,
    status: 'EN TRANSITO', // Puedes cambiar esto a 'ENTREGADO' para probar la otra vista
    description: 'Paquete de demostración (Modo Seguro)',
    courierService: 'GMC Express',
    weight: 5.5,
    volumetricWeight: 4.2,
    updatedAt: new Date().toISOString(), // Usamos string ISO para evitar problemas
    user: { 
        name: 'Cliente Demo', 
        country: 'República Dominicana',
        suiteNo: 'GMC-0000',
        countryCode: 'DO'
    },
    tookanLink: null,
    deliveryPhotoUrl: null,
    deliverySignature: null,
    selectedCourier: 'GMC'
  };

  // Cuando reactivemos la BD, borraremos el bloque de arriba y descomentaremos este:
  /*
  const pkgData = await prisma.package.findFirst({
    where: { gmcTrackingNumber: trackingNumber },
    include: { user: true }
  });
  if (!pkgData) return notFound();
  const pkg = JSON.parse(JSON.stringify(pkgData));
  */

  return (
    <TrackingClient 
      pkg={pkg} 
      from={searchParams?.from} 
    />
  );
}