import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ActivePackagesClient from './ActivePackagesClient';

export const dynamic = 'force-dynamic';

export default async function ActivePackagesPage({ 
  params, 
  searchParams 
}: { 
  params: { locale: string };
  searchParams: { q?: string }; 
}) {
  const session = await auth();

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE')) {
    // redirect('/login-cliente'); 
  }

  const query = searchParams.q || '';
  const currentLocale = params.locale || 'en';
  let allItems: any[] = [];

  try {
      // 1. 🔥 PAQUETES INDIVIDUALES (Pickups, USPS local y paquetes no consolidados)
      const loosePackagesRaw = await prisma.package.findMany({
        where: {
          status: { notIn: ['ENTREGADO', 'CANCELADO'] },
          
          // 👇 LA REGLA MÁGICA 👇
          // Deja el paquete suelto si NO tiene caja, o si su caja NO es internacional/consolidada.
          // Esto asegura que Pickups y USPS se vean normales.
          OR: [
              { consolidatedShipmentId: null }, 
              { consolidatedShipment: { serviceType: { notIn: ['CONSOLIDATION', 'SHIPPING_INTL'] } } } 
          ],

          ...(query ? {
            OR: [
              { id: { contains: query, mode: 'insensitive' } }, 
              { gmcTrackingNumber: { contains: query, mode: 'insensitive' } },
              { carrierTrackingNumber: { contains: query, mode: 'insensitive' } },
              { user: { name: { contains: query, mode: 'insensitive' } } },
            ]
          } : {})
        },
        include: {
          user: { select: { id: true, name: true, suiteNo: true, countryCode: true, phone: true, email: true } },
          consolidatedShipment: { 
            select: { 
                totalAmount: true,
                paymentId: true,
                packages: { select: { id: true } } 
            } 
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // 🛠️ EL ARREGLO PARA PAQUETES: Truco Ninja
      const formattedLoosePackages = loosePackagesRaw.map(pkg => {
        const isDocument = pkg.courier === 'Buzón Virtual' || (pkg.carrierTrackingNumber || '').startsWith('DOC-') || (pkg.gmcTrackingNumber || '').startsWith('GMC-DOC-');
        
        const realTotal = isDocument ? 0.00 : (pkg.shippingTotalPaid !== null ? pkg.shippingTotalPaid : pkg.shippingSubtotal);

        return {
          ...pkg,
          type: 'PACKAGE',
          shippingSubtotal: realTotal, 
          totalAmount: realTotal, 
        };
      });

      // 2. 🔥 CONSOLIDACIONES REALES Y ENVÍOS INTERNACIONALES (Cajas Maestras)
      const activeShipments = await prisma.consolidatedShipment.findMany({
        where: {
          status: { notIn: ['ENTREGADO', 'CANCELADO'] },
          
          // 👇 EL ESCUDO INTELIGENTE 👇
          // Solo atrapa Cajas Maestras (Nelsom, Aisha). Ignora Pickups y USPS local.
          serviceType: { in: ['CONSOLIDATION', 'SHIPPING_INTL'] }, 

          ...(query ? {
            OR: [
              { id: { contains: query, mode: 'insensitive' } }, 
              { gmcShipmentNumber: { contains: query, mode: 'insensitive' } },
              { user: { name: { contains: query, mode: 'insensitive' } } },
            ]
          } : {})
        },
        include: {
          user: { select: { id: true, name: true, suiteNo: true, countryCode: true, phone: true, email: true } },
          packages: { 
              select: { 
                  id: true, 
                  gmcTrackingNumber: true,
                  description: true, 
                  declaredValue: true, 
                  customsItems: true 
              } 
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const formattedShipments = activeShipments.map(ship => ({
        id: ship.id,
        type: 'SHIPMENT', 
        gmcTrackingNumber: ship.gmcShipmentNumber,
        carrierTrackingNumber: `CAJA (${ship.weightLbs || 0} lbs)`, 
        user: ship.user,
        description: 'Consolidación', 
        createdAt: ship.createdAt,
        selectedCourier: ship.selectedCourier,
        courierService: ship.courierService,
        weightLbs: ship.weightLbs,
        lengthIn: ship.lengthIn,
        widthIn: ship.widthIn,
        heightIn: ship.heightIn,
        shippingTotalPaid: ship.totalAmount, 
        totalAmount: ship.totalAmount, 
        paymentId: ship.paymentId, 
        finalTrackingNumber: ship.finalTrackingNumber,
        status: ship.status,
        shippingLabelUrl: ship.shippingLabelUrl, 
        isProcessing: false,
        isStorePickup: false,
        packages: ship.packages 
      }));

      // 3. UNIFICAMOS LAS 2 TABLAS DE INVENTARIO
      allItems = [...formattedLoosePackages, ...formattedShipments].sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

  } catch (error) {
      console.error("⚠️ Error de base de datos:", error);
      allItems = [];
  }

  const serializedItems = JSON.parse(JSON.stringify(allItems));

  return (
      <ActivePackagesClient 
          allItems={serializedItems} 
          currentLocale={currentLocale} 
      />
  );
}