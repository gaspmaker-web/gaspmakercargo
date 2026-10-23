import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { jwtVerify } from 'jose';

async function getDriverFromToken(req: Request) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'secret');
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as any;
  } catch { return null; }
}

export async function GET(req: Request) {
  const driver = await getDriverFromToken(req);
  if (!driver) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const driverId = driver.id;
  const driverZone = driver.countryCode || 'US';
  const isMiamiDriver = driverZone.toUpperCase() === 'US';

  const dbDriver = await prisma.user.findUnique({
    where: { id: driverId },
    select: { countryCode: true, name: true, image: true }
  });
  const zone = dbDriver?.countryCode || 'US';

  // Oportunidades disponibles
  let availableTasks: any[] = [];
  if (isMiamiDriver) {
    availableTasks = await prisma.pickupRequest.findMany({
      where: { status: { in: ['PENDIENTE', 'PAGADO'] }, driverId: null, serviceType: { notIn: ['STORAGE', 'STORAGE_FEE'] } },
      orderBy: { pickupDate: 'asc' },
      include: { user: { select: { name: true } } },
      take: 10,
    });
  }

  // Mis tareas activas
  const myPickupTasks = await prisma.pickupRequest.findMany({
    where: { driverId, status: { in: ['ACEPTADO', 'EN_CAMINO', 'EN_REPARTO', 'EN_RUTA'] }, serviceType: { notIn: ['STORAGE', 'STORAGE_FEE'] } },
    orderBy: { pickupDate: 'asc' }
  });

  // Entregas activas
  const packageOrConditions: any[] = [
    { shippingAddress: { contains: zone, mode: 'insensitive' } },
    { user: { countryCode: zone } }
  ];
  if (zone === 'US') packageOrConditions.push({ courierService: { contains: 'Local Delivery', mode: 'insensitive' } });

  const activePackages = await prisma.package.findMany({
    where: {
      status: { in: ['EN_REPARTO', 'OUT_FOR_DELIVERY', 'EN_CAMINO', 'EN_RUTA'] },
      consolidatedShipmentId: null,
      OR: packageOrConditions,
      NOT: { OR: [{ selectedCourier: { contains: 'UPS', mode: 'insensitive' } }, { selectedCourier: { contains: 'DHL', mode: 'insensitive' } }, { selectedCourier: { contains: 'FEDEX', mode: 'insensitive' } }] }
    },
    include: { user: { select: { name: true, address: true } } },
    take: 20,
  });

  const activeConsolidations = await prisma.consolidatedShipment.findMany({
    where: {
      status: { in: ['EN_REPARTO', 'OUT_FOR_DELIVERY', 'EN_CAMINO', 'EN_RUTA'] },
      OR: [...packageOrConditions, { destinationCountryCode: zone }],
      NOT: { OR: [{ selectedCourier: { contains: 'UPS', mode: 'insensitive' } }, { selectedCourier: { contains: 'DHL', mode: 'insensitive' } }, { selectedCourier: { contains: 'FEDEX', mode: 'insensitive' } }] }
    },
    include: { user: { select: { name: true, address: true } }, packages: true },
    take: 20,
  });

  return NextResponse.json({
    driver: { name: dbDriver?.name, image: dbDriver?.image, zone },
    availableTasks: availableTasks.map(t => ({
      id: t.id, serviceType: t.serviceType, originAddress: t.originAddress,
      pickupDate: t.pickupDate, userName: t.user?.name, volumeInfo: (t as any).volumeInfo
    })),
    myPickupTasks: myPickupTasks.map(t => ({
      id: t.id, originAddress: t.originAddress, dropOffAddress: t.dropOffAddress,
      pickupDate: t.pickupDate, status: t.status
    })),
    deliveries: [
      ...activeConsolidations.map(c => ({
        id: c.id, type: 'CONSOLIDATION', tracking: c.gmcShipmentNumber,
        userName: c.user?.name, address: c.shippingAddress || c.user?.address,
        count: c.packages.length, weightLbs: c.weightLbs || 0
      })),
      ...activePackages.map(p => ({
        id: p.id, type: 'PACKAGE', tracking: p.gmcTrackingNumber,
        userName: p.user?.name, address: p.shippingAddress || p.user?.address,
        count: 1, weightLbs: p.weightLbs || 0
      }))
    ]
  });
}
