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
      // 1. 🔥 PAQUETES (Leemos la información real de la tabla Package, como pediste)
      const loosePackagesRaw = await prisma.package.findMany({
        where: {
          status: { notIn: ['ENTREGADO', 'CANCELADO'] },
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
                serviceType: true,
                totalAmount: true,
                paymentId: true,
                _count: { select: { packages: true } }
            } 
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const formattedLoosePackages = loosePackagesRaw.filter(pkg => {
         // Si está suelto, pasa.
         if (!pkg.consolidatedShipmentId) return true;
         
         // 🔥 EL TRUCO: Si la caja maestra SOLO tiene 1 paquete, extraemos la info real del paquete (GM-US) 
         // y ocultamos el disfraz de la caja consolidada.
         if (pkg.consolidatedShipment && pkg.consolidatedShipment._count.packages === 1) return true;
         
         if (pkg.consolidatedShipment && !['CONSOLIDATION', 'SHIPPING_INTL', 'DOCUMENT'].includes(pkg.consolidatedShipment.serviceType)) return true;
         
         return false;
      }).map(pkg => {
        const isDocument = pkg.courier === 'Buzón Virtual' || (pkg.carrierTrackingNumber || '').startsWith('DOC-') || (pkg.gmcTrackingNumber || '').startsWith('GMC-DOC-');
        const realTotal = isDocument ? 0.00 : (pkg.shippingTotalPaid !== null ? pkg.shippingTotalPaid : pkg.shippingSubtotal);

        return {
          ...pkg,
          type: 'PACKAGE',
          shippingSubtotal: realTotal, 
          totalAmount: realTotal, 
          stripePaymentId: pkg.stripePaymentId || pkg.consolidatedShipment?.paymentId || null
        };
      });

      // 2. 🔥 CONSOLIDACIONES REALES (Solo GMC-SHIP con 2 o más paquetes)
      const activeShipmentsRaw = await prisma.consolidatedShipment.findMany({
        where: {
          status: { notIn: ['ENTREGADO', 'CANCELADO'] },
          serviceType: { in: ['CONSOLIDATION', 'SHIPPING_INTL', 'DOCUMENT'] }, 
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
          },
          _count: { select: { packages: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      const formattedShipments = activeShipmentsRaw.filter(ship => {
          // 🔥 REGLA estricta: La caja consolidada GMC-SHIP solo existe en frontend si tiene > 1 paquete
          return ship._count.packages > 1;
      }).map(ship => {
        return {
          id: ship.id,
          type: 'SHIPMENT', 
          gmcTrackingNumber: ship.gmcShipmentNumber,
          carrierTrackingNumber: `CAJA (${ship.weightLbs || 0} lbs)`, 
          user: ship.user,
          description: 'Consolidación', 
          serviceType: ship.serviceType, 
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
        };
      });

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