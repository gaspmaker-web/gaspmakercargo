import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
// ❌ BackButton eliminado
import { Package } from 'lucide-react';
import DeliveredPackagesCarousel from '@/components/client/DeliveredPackagesCarousel';
// 🔥 1. Importamos la función para traducciones en servidor
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function EnDestinoPage({ params: { locale } }: { params: { locale: string } }) {
  const session = await auth();
  
  // 🔥 2. Cargamos las traducciones (Namespace: 'DeliveredPage')
  const t = await getTranslations('DeliveredPage');

  if (!session?.user) {
    redirect('/login-cliente');
  }

  // 1. Buscar paquetes ENTREGADOS
  const deliveredPackages = await prisma.package.findMany({
    where: {
      userId: session.user.id,
      
      // Estado fundamental: Entregado
      status: { in: ['ENTREGADO', 'DELIVERED', 'COMPLETADO'] },

      // 🔥 LÓGICA MAESTRA (Suelto vs Consolidado) 🔥
      OR: [
          // CASO 1: Paquetes Sueltos (Sin consolidar)
          {
              AND: [
                  { consolidatedShipmentId: null },
                  // BLOQUE DE EXCLUSIÓN CORREGIDO (Sintaxis segura para Prisma)
                  {
                      NOT: {
                          OR: [
                              { selectedCourier: 'CLIENTE_RETIRO' },
                              { courierService: { contains: 'Recogida', mode: 'insensitive' } },
                              { courierService: { contains: 'Tienda', mode: 'insensitive' } },
                              { courierService: { contains: 'Pickup', mode: 'insensitive' } }
                          ]
                      }
                  }
              ]
          },

          // CASO 2: Paquetes Consolidados (Basado en tus tablas de Supabase)
          {
              consolidatedShipment: {
                  // Aquí filtramos por el tipo de servicio del padre
                  // 'STORAGE_FEE' es el código que usa tu DB para los pickups (como el paquete "Eded")
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
                gmcShipmentNumber: true, // <--- 🔥 AGREGAMOS ESTA LÍNEA
                finalTrackingNumber: true,
                serviceType: true
            }
        }
    },
    orderBy: { updatedAt: 'desc' }
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 font-montserrat">
      <div className="max-w-4xl mx-auto">
        
        {/* Header CENTRADO y LIMPIO */}
        <div className="mb-6 flex justify-center">
          <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-full text-green-600">
                  <Package size={28} />
              </div>
              <div>
                  {/* 🔥 3. Usamos la variable de traducción */}
                  <h1 className="text-2xl md:text-3xl font-bold text-gasp-maker-dark-gray font-garamond">
                      {t('title')}
                  </h1>
                  <p className="text-gray-500 text-sm">{t('subtitle')}</p>
              </div>
          </div>
        </div>

        {/* Carrusel de Entregas */}
        <DeliveredPackagesCarousel 
            packages={deliveredPackages} 
            userCountryCode={session.user.countryCode?.toUpperCase() || ''}
        />

      </div>
    </div>
  );
}