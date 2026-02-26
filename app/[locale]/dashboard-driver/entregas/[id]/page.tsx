import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import DeliveryClient from './DeliveryClient';

export const dynamic = 'force-dynamic';

export default async function DriverDeliveryPage({ params }: { params: { id: string, locale: string } }) {
  const session = await auth();

  if (!session || session.user.role?.trim()?.toUpperCase() !== 'DRIVER') {
    redirect(`/${params.locale}/login-cliente`);
  }

  // 1. Buscamos en Consolidaciones
  let item: any = await prisma.consolidatedShipment.findUnique({
    where: { id: params.id },
    include: { 
        user: true,
        packages: true // 🔥 MAGIA: Le decimos a Prisma que traiga todo el contenido de la caja
    }
  });

  // 2. Si no es Consolidación, buscamos en Paquetes
  if (!item) {
    item = await prisma.package.findUnique({
        where: { id: params.id },
        include: { user: true }
    });
  }

  // 3. Si tampoco es Paquete, buscamos en Pickups
  if (!item) {
    item = await prisma.pickupRequest.findUnique({
        where: { id: params.id },
        include: { user: true }
    });
  }

  if (!item) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
            <h1 className="text-2xl font-bold text-gray-800">Envío No Encontrado</h1>
        </div>
      );
  }

  const deliveryAddress = item.dropOffAddress || item.shippingAddress || item.user?.address || 'Dirección no especificada';
  // 🔥 Mostramos el tracking real (no cortado) para mayor profesionalismo
  const tracking = (item.gmcShipmentNumber || item.gmcTrackingNumber || item.id).toUpperCase();
  const countryCode = item.user?.countryCode || 'US';
  const clientNote = item.description || item.user?.note || '';
  
  const clientName = item.dropOffContact || item.user?.name || 'Cliente';
  const clientPhone = item.dropOffPhone || item.contactPhone || item.user?.phone || '';

  // 🔥 Variables nuevas para el diseño de Amazon Flex
  const childPackages = item.packages || [];
  const isConsolidation = !!item.gmcShipmentNumber; 

  return (
      <DeliveryClient 
          packageId={params.id}
          locale={params.locale}
          deliveryAddress={deliveryAddress}
          clientName={clientName}
          clientPhone={clientPhone}
          tracking={tracking}
          clientNote={clientNote}
          countryCode={countryCode}
          // Pasamos los nuevos datos al cliente
          childPackages={childPackages}
          isConsolidation={isConsolidation}
      />
  );
}