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
      // 1. 🔥 PAQUETES INDIVIDUALES (Mercancía real en tu bodega)
      const loosePackagesRaw = await prisma.package.findMany({
        where: {
          status: { notIn: ['ENTREGADO', 'CANCELADO'] },
          OR: [
              { consolidatedShipmentId: null }, 
              { consolidatedShipment: { serviceType: { not: 'CONSOLIDATION' } } } 
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
          // 🔥 AQUÍ AGREGAMOS PHONE Y EMAIL PARA EL INVOICE ADUANAL
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

      // 🛠️ EL ARREGLO PARA PAQUETES: Truco Ninja para forzar a la pantalla a leer el Total
      const formattedLoosePackages = loosePackagesRaw.map(pkg => ({
        ...pkg,
        type: 'PACKAGE',
        // 🔥 Engañamos a la pantalla: Si hay un total pagado con comisión, sobrescribimos el subtotal
        shippingSubtotal: pkg.shippingTotalPaid ? pkg.shippingTotalPaid : pkg.shippingSubtotal, 
        totalAmount: pkg.shippingTotalPaid || 0, // 🔥 Aseguramos la variable
      }));

      // 2. 🔥 CONSOLIDACIONES REALES (El Escudo Definitivo)
      const activeShipments = await prisma.consolidatedShipment.findMany({
        where: {
          status: { notIn: ['ENTREGADO', 'CANCELADO'] },
          serviceType: 'CONSOLIDATION', // 🛡️ EL ESCUDO
          ...(query ? {
            OR: [
              { id: { contains: query, mode: 'insensitive' } }, 
              { gmcShipmentNumber: { contains: query, mode: 'insensitive' } },
              { user: { name: { contains: query, mode: 'insensitive' } } },
            ]
          } : {})
        },
        include: {
          // 🔥 AQUÍ TAMBIÉN AGREGAMOS PHONE Y EMAIL PARA EL INVOICE DE CAJAS
          user: { select: { id: true, name: true, suiteNo: true, countryCode: true, phone: true, email: true } }
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
        totalAmount: ship.totalAmount, // 🔥 Aseguramos la variable para el frontend
        paymentId: ship.paymentId, 
        finalTrackingNumber: ship.finalTrackingNumber,
        status: ship.status,
        shippingLabelUrl: ship.shippingLabelUrl, 
        isProcessing: false,
        isStorePickup: false 
      }));

      // ✂️ AQUÍ FUE ELIMINADO EL PASO 3 (SOLICITUDES DE RETIRO / PICKUPS) ✂️
      // Ya no "robamos" información de la tabla PickupRequest.

      // 3. UNIFICAMOS SOLO LAS 2 TABLAS DE INVENTARIO
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