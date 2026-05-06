import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Package } from 'lucide-react';
import DeliveredPackagesCarousel from '@/components/client/DeliveredPackagesCarousel';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function EnDestinoPage({ params: { locale } }: { params: { locale: string } }) {
  const session = await auth();
  
  const t = await getTranslations('DeliveredPage');

  if (!session?.user) {
    redirect('/login-cliente');
  }

  const deliveredPackages = await prisma.package.findMany({
    where: {
      userId: session.user.id,
      status: { in: ['ENTREGADO', 'DELIVERED', 'COMPLETADO'] },
      NOT: {
          OR: [
              { selectedCourier: 'CLIENTE_RETIRO' },
              { deliverySignature: 'ENTREGA_TIENDA' },
              { courierService: { contains: 'Cita', mode: 'insensitive' } }
          ]
      },
      OR: [
          {
              AND: [
                  { consolidatedShipmentId: null },
                  {
                      NOT: {
                          OR: [
                              { courierService: { contains: 'Recogida', mode: 'insensitive' } },
                              { courierService: { contains: 'Tienda', mode: 'insensitive' } },
                              { courierService: { contains: 'Pickup', mode: 'insensitive' } }
                          ]
                      }
                  }
              ]
          },
          {
              consolidatedShipment: {
                  serviceType: {
                      notIn: ['STORAGE_FEE', 'PICKUP', 'Recogida en Tienda']
                  }
              }
          }
      ]
    },
   include: {
        user: {
            select: { country: true }
        },
        consolidatedShipment: {
            select: {
                id: true,
                gmcShipmentNumber: true, 
                finalTrackingNumber: true,
                serviceType: true,
                awbDocumentUrl: true // 🔥 AGREGAMOS ESTO: Para asegurar que baje el PDF del Master
            }
        }
    },
    orderBy: { updatedAt: 'desc' }
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 font-montserrat">
      <div className="max-w-4xl mx-auto">
        
        <div className="mb-6 flex justify-center">
          <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-full text-green-600">
                  <Package size={28} />
              </div>
              <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gasp-maker-dark-gray font-garamond">
                      {t('title')}
                  </h1>
                  <p className="text-gray-500 text-sm">{t('subtitle')}</p>
              </div>
          </div>
        </div>

        <DeliveredPackagesCarousel 
            packages={deliveredPackages} 
            userCountryCode={session.user.countryCode?.toUpperCase() || ''}
        />

      </div>
    </div>
  );
}