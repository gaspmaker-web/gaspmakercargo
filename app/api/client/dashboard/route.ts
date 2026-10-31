import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

const STORAGE_FREE_DAYS = 30;
const STORAGE_RATE_PER_CFT = 2.25;

function calculateHandlingFee(weightLbs: number | null | undefined): number {
  if (!weightLbs || weightLbs <= 0) return 0;
  if (weightLbs <= 10) return 2.50;
  if (weightLbs <= 50) return 5.00;
  if (weightLbs <= 150) return 12.50;
  return 30.00;
}

function calculateStorageFee(pkg: { createdAt: Date; storagePaidUntil?: Date | null; lengthIn?: number | null; widthIn?: number | null; heightIn?: number | null }): number {
  const today = new Date();
  const freePeriodEnd = new Date(pkg.createdAt);
  freePeriodEnd.setDate(freePeriodEnd.getDate() + STORAGE_FREE_DAYS);
  let debtStartDate = freePeriodEnd;
  if (pkg.storagePaidUntil && new Date(pkg.storagePaidUntil) > freePeriodEnd) {
    debtStartDate = new Date(pkg.storagePaidUntil);
  }
  if (today <= debtStartDate) return 0;
  const daysOwed = Math.floor((today.getTime() - debtStartDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysOwed <= 0) return 0;
  const l = pkg.lengthIn || 0; const w = pkg.widthIn || 0; const h = pkg.heightIn || 0;
  const cft = (l * w * h) / 1728;
  if (cft <= 0) return 0;
  return parseFloat((cft * STORAGE_RATE_PER_CFT * (daysOwed / 30)).toFixed(2));
}

async function getUserFromToken(req: Request) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'secret');
  try { const { payload } = await jwtVerify(token, secret); return payload as any; }
  catch { return null; }
}

export async function GET(req: Request) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, suiteNo: true, walletBalance: true, image: true, countryCode: true, phone: true }
    });
    if (!dbUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    const allPackages = await prisma.package.findMany({
      where: { userId: user.id, consolidatedShipmentId: null },
      orderBy: { createdAt: 'desc' }, take: 50,
      select: { id: true, gmcTrackingNumber: true, status: true, description: true, weightLbs: true, createdAt: true, courier: true, lengthIn: true, widthIn: true, heightIn: true, storagePaidUntil: true }
    });

    const packagesWithFees = allPackages.map(p => {
      const storageFee = calculateStorageFee({ createdAt: new Date(p.createdAt), storagePaidUntil: p.storagePaidUntil ? new Date(p.storagePaidUntil) : null, lengthIn: p.lengthIn, widthIn: p.widthIn, heightIn: p.heightIn });
      const handlingFee = calculateHandlingFee(p.weightLbs);
      const isBlocked = storageFee >= 5;
      return { id: p.id, gmcTrackingNumber: p.gmcTrackingNumber, status: p.status, description: p.description, weightLbs: p.weightLbs, createdAt: p.createdAt, courier: p.courier, storageFee, handlingFee, isBlocked };
    });

    const shipments = await prisma.consolidatedShipment.findMany({
      where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 20,
      select: { id: true, gmcShipmentNumber: true, status: true, selectedCourier: true, finalTrackingNumber: true, createdAt: true, totalAmount: true, packages: { select: { id: true } } }
    });

    const DEBT_STATUSES = ['PENDIENTE_PAGO', 'PENDIENTE', 'CREATED', 'EN_ALMACEN'];
    const totalDebt = shipments.filter(s => DEBT_STATUSES.includes(s.status)).reduce((sum, s) => sum + (s.totalAmount || 0), 0);

    const pickups = await prisma.pickupRequest.findMany({
      where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 10,
      select: { id: true, status: true, originAddress: true, dropOffAddress: true, pickupDate: true, totalPaid: true }
    });

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id, isRead: false }, orderBy: { createdAt: 'desc' }, take: 5,
      select: { id: true, title: true, message: true, createdAt: true, type: true }
    });

    const packagesInMiami = packagesWithFees.filter(p => ['RECIBIDO','EN_BODEGA','DISPONIBLE'].includes(p.status)).length;
    const inTransit = shipments.filter(s => ['EN_CAMINO','EN_REPARTO','EN_RUTA'].includes(s.status)).length;
    const atDestination = shipments.filter(s => s.status === 'EN_DESTINO').length;
    const pendingPickups = pickups.filter(p => ['PENDIENTE','PAGADO','ACEPTADO'].includes(p.status)).length;
    const blockedPackages = packagesWithFees.filter(p => p.isBlocked).length;
    const totalStorageFees = parseFloat(packagesWithFees.reduce((s, p) => s + p.storageFee, 0).toFixed(2));
    const totalHandlingFees = parseFloat(packagesWithFees.reduce((s, p) => s + p.handlingFee, 0).toFixed(2));

    return NextResponse.json({
      user: { ...dbUser, miamiAddress: { recipient: 'Renischka Laporte', address: `1861 NW 22nd St, Suite ${dbUser.suiteNo || ''}`, city: 'Miami, FL 33142', country: 'United States', phone: dbUser.phone || '786-282-0763' } },
      packages: packagesWithFees.slice(0, 20),
      shipments: shipments.map(s => ({ ...s, packagesCount: s.packages.length })),
      pickups, notifications,
      summary: { packagesInMiami, inTransit, atDestination, pendingPickups, unreadNotifications: notifications.length, blockedPackages, totalStorageFees, totalHandlingFees, totalDebt: parseFloat(totalDebt.toFixed(2)), hasDebt: totalDebt > 0 }
    });
  } catch (err) {
    console.error('[client/dashboard]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
// Sat Oct 31 00:33:17 EDT 2026
