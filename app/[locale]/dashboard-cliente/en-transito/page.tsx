import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
// ❌ BackButton eliminado
import { Truck, ArrowRight } from 'lucide-react';
import InTransitPackagesCarousel from '@/components/client/InTransitPackagesCarousel';
// 🔥 1. Importamos la función para traducciones en servidor
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function EnTransitoPage({ params: { locale } }: { params: { locale: string } }) {
  const session = await auth();
  
  // 🔥 2. Cargamos las traducciones (Namespace: 'InTransitPage')
  const t = await getTranslations('InTransitPage');

  if (!session?.user) {
    redirect('/login-cliente');
  }

  // 1. Buscar paquetes ACTIVOS
  const activePackages = await prisma.package.findMany({
    where: {
      userId: session.user.id,
      
      // A) Filtro por Estado (Tu lógica original)
      // Mantenemos visible lo que se está moviendo o procesando
      status: { 
        notIn: [
            'ENTREGADO', 'DELIVERED', 'COMPLETADO', 'CANCELADO', 'ENTREGADO_HISTORICO',
            'RECIBIDO_MIAMI', 'EN_ALMACEN', 'PENDIENTE', 'PENDIENTE_PAGO', 'CREATED',
            'LISTO_PARA_RETIRO', 'EN_TIENDA'
        ] 
      },

      // B) Lógica de Clasificación (Suelto vs Consolidado)
      OR: [
        // CASO 1: Paquetes Sueltos (Sin consolidar)
        { 
            AND: [
                { consolidatedShipmentId: null },
                // Filtro extra: Que no sea un retiro marcado manualmente
                { selectedCourier: { not: 'CLIENTE_RETIRO' } }
            ]
        }, 
        
        // CASO 2: Paquetes Consolidados (Aquí está la clave)
        { 
            consolidatedShipment: {
                // 1. Estado de la factura: No mostramos borradores ni impagos
                status: {
                    notIn: ['PENDIENTE_PAGO', 'PENDIENTE', 'CREATED']
                },
                
                // 2. 🔥 FILTRO MAESTRO: TIPO DE SERVICIO 🔥
                // Excluimos explícitamente 'STORAGE_FEE' (lo que es "Eded") y 'PICKUP'.
                // Dejamos pasar 'CONSOLIDATION' (lo que es "Dede") y 'SHIPPING_INTL'.
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
                finalTrackingNumber: true, 
                status: true, 
                selectedCourier: true,
                _count: { select: { packages: true } }
            }
        }
    },
    orderBy: { updatedAt: 'desc' }
  });

  return (
    <div className="min-h-screen bg-gray-50 font-montserrat flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col p-4 sm:p-6 lg:p-8">
        
        {/* Header CENTRADO y SIN BOTÓN VOLVER */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-full text-blue-600 shadow-sm">
                  <Truck size={28} />
              </div>
              <div>
                  {/* 🔥 3. Usamos la variable de traducción */}
                  <h1 className="text-2xl md:text-3xl font-bold text-gasp-maker-dark-gray font-garamond">
                      {t('title')}
                  </h1>
                  <p className="text-gray-500 text-sm">
                      {t('subtitle')} <ArrowRight size={12} className="inline animate-pulse"/>
                  </p>
              </div>
          </div>
        </div>

        {/* Carrusel */}
        <div className="flex-1 flex flex-col justify-center">
             <InTransitPackagesCarousel 
                packages={activePackages} 
                userCountryCode={session.user.countryCode || 'US'} 
             />
        </div>

      </div>
    </div>
  );
}