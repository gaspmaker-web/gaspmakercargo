import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Truck, ArrowRight } from 'lucide-react';
import InTransitPackagesCarousel from '@/components/client/InTransitPackagesCarousel';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function EnTransitoPage({ params: { locale } }: { params: { locale: string } }) {
  const session = await auth();
  
  const t = await getTranslations('InTransitPage');

  if (!session?.user) {
    redirect('/login-cliente');
  }

  // 1. Buscar paquetes ACTIVOS
  const activePackages = await prisma.package.findMany({
    where: {
      userId: session.user.id,
      
      status: { 
        notIn: [
            'ENTREGADO', 'DELIVERED', 'COMPLETADO', 'CANCELADO', 'ENTREGADO_HISTORICO',
            'RECIBIDO_MIAMI', 'EN_ALMACEN', 'PENDIENTE', 'PENDIENTE_PAGO', 'CREATED',
            'LISTO_PARA_RETIRO', 'EN_TIENDA'
        ] 
      },

      OR: [
        { 
            AND: [
                { consolidatedShipmentId: null },
                { selectedCourier: { not: 'CLIENTE_RETIRO' } }
            ]
        }, 
        { 
            consolidatedShipment: {
                status: {
                    notIn: ['PENDIENTE_PAGO', 'PENDIENTE', 'CREATED']
                },
                serviceType: {
                    notIn: ['STORAGE_FEE', 'PICKUP', 'Recogida en Tienda']
                }
            }
        }
      ]
    },
    include: {
        consolidatedShipment: {
            select: { 
                id: true, 
                gmcShipmentNumber: true,
                finalTrackingNumber: true, 
                status: true, 
                selectedCourier: true,
                serviceType: true,        
                courierService: true,     
                awbDocumentUrl: true,   
                shippingAddress: true,
                packages: {
                    select: {
                        id: true,
                        gmcTrackingNumber: true,
                        carrierTrackingNumber: true,
                        finalTrackingNumber: true,
                        description: true,
                        weightLbs: true,
                        status: true,
                        selectedCourier: true,
                        courierService: true,
                        awbDocumentUrl: true,
                        shippingAddress: true
                    }
                },
                _count: { select: { packages: true } }
            }
        }
    },
    orderBy: { updatedAt: 'desc' }
  });

  // 🔥 ENTERPRISE FIX: Query separada para traer TODOS los hijos con campos completos
  // Prisma limita registros anidados en producción para consolidaciones grandes (135+ paquetes)
  const shipmentIds = activePackages
      .map(p => p.consolidatedShipmentId)
      .filter(Boolean) as string[];

  const uniqueIds = [...new Set(shipmentIds)];

  const allChildPackages = uniqueIds.length > 0
      ? await prisma.package.findMany({
          where: { consolidatedShipmentId: { in: uniqueIds } },
          select: {
              id: true,
              consolidatedShipmentId: true,
              gmcTrackingNumber: true,
              carrierTrackingNumber: true,
              finalTrackingNumber: true,
              description: true,
              weightLbs: true,
              status: true,
              selectedCourier: true,
              courierService: true,
              awbDocumentUrl: true,
              shippingAddress: true
          },
          orderBy: { createdAt: 'asc' }
      })
      : [];

  // 🔥 Inyectar los hijos completos en cada consolidación
  const enrichedPackages = activePackages.map(pkg => {
      if (!pkg.consolidatedShipmentId) return pkg;
      return {
          ...pkg,
          consolidatedShipment: {
              ...pkg.consolidatedShipment,
              packages: allChildPackages.filter(
                  c => c.consolidatedShipmentId === pkg.consolidatedShipmentId
              )
          }
      };
  });

  return (
    <div className="min-h-screen bg-gray-50 font-montserrat flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col p-4 sm:p-6 lg:p-8">
        
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-full text-blue-600 shadow-sm">
                  <Truck size={28} />
              </div>
              <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gasp-maker-dark-gray font-garamond">
                      {t('title')}
                  </h1>
                  <p className="text-gray-500 text-sm">
                      {t('subtitle')} <ArrowRight size={12} className="inline animate-pulse"/>
                  </p>
              </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center">
             <InTransitPackagesCarousel 
                packages={enrichedPackages} 
                userCountryCode={session.user.countryCode || 'US'} 
             />
        </div>

      </div>
    </div>
  );
}