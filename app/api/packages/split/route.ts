import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { getTenant } = await import('@/lib/tenant');
    const tenant = await getTenant();

    const body = await req.json();
    const { parentPackageId, boxes } = body;

    // Obtener el paquete madre
    const parentPkg = await prisma.package.findUnique({
      where: { id: parentPackageId },
      include: { user: true }
    });

    if (!parentPkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    // Crear un paquete individual por cada caja
    const createdPackages = [];
    for (const box of boxes) {
      // Generar tracking GMC único
      const randomSuffix = Math.random().toString(36).substring(2, 12).toUpperCase();
      const gmcTracking = `GM-${parentPkg.user.suiteNo?.substring(0, 2) || 'US'}-${randomSuffix}`;

      const newPkg = await prisma.package.create({
        data: {
          gmcTrackingNumber: gmcTracking,
          status: 'RECIBIDO_MIAMI',
          description: box.description || `Box from ${parentPkg.gmcTrackingNumber}`,
          weightLbs: parseFloat(box.weight) || 0,
          lengthIn: parseFloat(box.length) || 0,
          widthIn: parseFloat(box.width) || 0,
          heightIn: parseFloat(box.height) || 0,
          declaredValue: parseFloat(box.value) || 0,
          photoUrlMiami: parentPkg.photoUrlMiami,
          carrierTrackingNumber: `REF:${parentPkg.gmcTrackingNumber}`,
          userId: parentPkg.userId,
          tenant_id: tenant?.id || null,
          serviceType: 'SHIPPING_INTL',
          customsItems: box.customsItems || [],
        }
      });
      createdPackages.push(newPkg);
    }

// Marcar el paquete madre como PROCESADO
await prisma.package.update({
  where: { id: parentPackageId },
  data: { status: 'PROCESADO' }
});

// Si viene de un pickup, marcar el pickupRequest también
if (body.isPickup) {
  await prisma.pickupRequest.update({
    where: { id: parentPackageId },
    data: { status: 'PROCESADO' }
  });
}
// Notificar al cliente
const { sendNotification } = await import('@/lib/notifications');
await sendNotification({
  userId: parentPkg.userId,
  title: '📦 Your packages are ready!',
  message: `Your pickup has been processed. ${createdPackages.length} packages are now available in your dashboard. Please upload the invoice for each one.`,
  href: '/en/dashboard-cliente',
  type: 'INFO'
});
    return NextResponse.json({ 
      success: true, 
      created: createdPackages.length,
      packages: createdPackages.map(p => p.gmcTrackingNumber)
    });

  } catch (error) {
    console.error('Error splitting package:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}