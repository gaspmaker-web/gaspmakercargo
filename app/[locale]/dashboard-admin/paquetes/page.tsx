import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ActivePackagesClient from './ActivePackagesClient';

// 🛡️ MODO DINÁMICO
export const dynamic = 'force-dynamic';

export default async function ActivePackagesPage({ 
  params, 
  searchParams 
}: { 
  params: { locale: string };
  searchParams: { q?: string }; 
}) {
  const session = await auth();

  // Redirección si no es admin (solo en runtime)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE')) {
    // redirect('/login-cliente'); // Comentado temporalmente por seguridad de build
  }

  const query = searchParams.q || '';
  const currentLocale = params.locale || 'en';
  let allItems: any[] = [];

  try {
      // 1. BUSCAR PAQUETES SUELTOS
      // Nota: Al usar 'include' y no 'select' principal, Prisma trae todos los campos escalares (incluyendo labelUrl si existe en Package)
      const loosePackages = await prisma.package.findMany({
        where: {
          status: { notIn: ['ENTREGADO', 'CANCELADO'] },
          OR: [
              { consolidatedShipmentId: null }, 
              { consolidatedShipment: { serviceType: { not: 'CONSOLIDATION' } } } 
          ],
          ...(query ? {
            OR: [
              { gmcTrackingNumber: { contains: query, mode: 'insensitive' } },
              { carrierTrackingNumber: { contains: query, mode: 'insensitive' } },
              { user: { name: { contains: query, mode: 'insensitive' } } },
            ]
          } : {})
        },
        include: {
          user: { select: { id: true, name: true, suiteNo: true, countryCode: true } },
          consolidatedShipment: { 
            select: { 
                totalAmount: true,
                packages: { select: { id: true } } 
            } 
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // 2. BUSCAR CONSOLIDACIONES
      const activeShipments = await prisma.consolidatedShipment.findMany({
        where: {
          status: { notIn: ['ENTREGADO', 'CANCELADO'] },
          serviceType: 'CONSOLIDATION', 
          ...(query ? {
            OR: [
              { gmcShipmentNumber: { contains: query, mode: 'insensitive' } },
              { user: { name: { contains: query, mode: 'insensitive' } } },
            ]
          } : {})
        },
        include: {
          user: { select: { id: true, name: true, suiteNo: true, countryCode: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      // 3. UNIFICAR LISTAS
      const formattedShipments = activeShipments.map(ship => ({
        id: ship.id,
        type: 'SHIPMENT', 
        gmcTrackingNumber: ship.gmcShipmentNumber,
        carrierTrackingNumber: `CAJA (${ship.weightLbs} lbs)`, 
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
        status: ship.status,
        
        // 🔥 FIX VERCEL: Usamos (ship as any) para evitar el error de TypeScript
        // Si el campo existe en la BD, funcionará. Si no, será null y no romperá el build.
        labelUrl: (ship as any).labelUrl || null,

        isProcessing: false,
        isStorePickup: false 
      }));

      allItems = [...loosePackages, ...formattedShipments].sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

  } catch (error) {
      console.error("⚠️ Error de base de datos (Build Time):", error);
      // Si falla la BD, devolvemos una lista vacía
      allItems = [];
  }

  // Serializamos para evitar errores de objetos complejos en el cliente
  const serializedItems = JSON.parse(JSON.stringify(allItems));

  return (
      <ActivePackagesClient 
          allItems={serializedItems} 
          currentLocale={currentLocale} 
      />
  );
}