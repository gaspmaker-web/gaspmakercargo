import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import ClientDashboard from "@/components/dashboard/ClientDashboard"; 
import OneSignalInit from "@/components/client/OneSignalInit"; 

import { calculateHandlingFee } from '@/lib/utils'; 

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'Dashboard' });
  return { title: `${t('welcome', { name: '' })} | Gasp Maker Cargo` };
}

const STORAGE_FREE_DAYS = 30;
const STORAGE_RATE_PER_CFT = 2.25;

function calculateFees(pkg: any, t: any) {
    const now = new Date();
    const arrivalDate = new Date(pkg.createdAt);
    const paidUntil = pkg.storagePaidUntil ? new Date(pkg.storagePaidUntil) : null;
    const totalDiff = Math.abs(now.getTime() - arrivalDate.getTime());
    const daysInWarehouse = Math.ceil(totalDiff / (1000 * 60 * 60 * 24)); 
    const length = Number(pkg.lengthIn) || 12;
    const width = Number(pkg.widthIn) || 12;
    const height = Number(pkg.heightIn) || 10;
    const volumeCft = (length * width * height) / 1728;

    let storageFee = 0;
    
    if (paidUntil) {
        const diffSincePaid = now.getTime() - paidUntil.getTime();
        const daysPending = Math.floor(diffSincePaid / (1000 * 60 * 60 * 24));
        if (daysPending > 0) {
            const dailyRate = (volumeCft * STORAGE_RATE_PER_CFT) / 30;
            storageFee = daysPending * dailyRate;
        } else {
            storageFee = 0; 
        }
    } else {
        if (daysInWarehouse > STORAGE_FREE_DAYS) {
            const chargeableDays = daysInWarehouse - STORAGE_FREE_DAYS;
            const monthlyCost = volumeCft * STORAGE_RATE_PER_CFT;
            const dailyRate = monthlyCost / 30;
            storageFee = chargeableDays * dailyRate;
        }
    }

    let handlingFee = 0;
    if (pkg.description === "Documento Físico (Enviado desde Buzón)") {
        handlingFee = 0;
    } else {
        handlingFee = calculateHandlingFee(pkg.weightLbs);
    }

    return {
        ...pkg,
        carrierTrackingNumber: pkg.carrierTrackingNumber || pkg.gmcTrackingNumber,
        description: pkg.description === "Documento Físico (Enviado desde Buzón)" 
                     ? t('physicalDocument') 
                     : (pkg.description || (pkg.gmcTrackingNumber?.startsWith('GMC') ? 'Pickup Procesado' : t('noDescription'))),
        daysInWarehouse,
        storageFee: parseFloat(storageFee.toFixed(2)),       
        pickupHandlingFee: parseFloat(handlingFee.toFixed(2)), 
        storageDebt: parseFloat(storageFee.toFixed(2)), 
        volumeCft: parseFloat(volumeCft.toFixed(2)),
        isBlocked: storageFee >= 1.00 
    };
}

interface Props {
  params: { locale: string };
}

export default async function DashboardPage({ params: { locale } }: Props) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login-cliente');
  }

  const mailboxSubscription = await prisma.mailboxSubscription.findUnique({
    where: { userId: session.user.id }
  });

  const hasMailbox = !!mailboxSubscription;
  const isKycMissing = mailboxSubscription?.status === 'PENDING_USPS' && !mailboxSubscription.uspsForm1583Url;
  const isKycRejected = mailboxSubscription?.status === 'REJECTED';
  const planType = mailboxSubscription?.planType || null; 
  const needsKycUpload = isKycMissing || isKycRejected;

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  const userPlan = (dbUser as any)?.planType;
  const resolvedPlanType = userPlan === 'VIP_WHOLESALE' ? 'VIP_WHOLESALE' : planType;

  const savedCards = await prisma.paymentMethod.findMany({
    where: { userId: session.user.id }
  });

  const allPackages = await prisma.package.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
        consolidatedShipment: {
            select: { 
                serviceType: true,
                courierService: true 
            }
        }
    }
  });

  const t = await getTranslations({ locale, namespace: 'Dashboard' });
  const normalizedPackages = allPackages.map(pkg => calculateFees(pkg, t));

  const isPickupPackage = (pkg: any) => {
      const isClientRetiro = pkg.selectedCourier === 'CLIENTE_RETIRO';
      const isServicePickup = pkg.courierService?.toUpperCase().includes('PICKUP') || 
                              pkg.courierService?.toUpperCase().includes('RECOGIDA') || 
                              pkg.courierService?.toUpperCase().includes('TIENDA');
      const isConsolidatedPickup = pkg.consolidatedShipment?.serviceType === 'PICKUP' || 
                                   pkg.consolidatedShipment?.courierService?.toUpperCase().includes('TIENDA');
      return isClientRetiro || isServicePickup || isConsolidatedPickup;
  };

  const inTransitCount = normalizedPackages.filter(pkg => {
    const s = pkg.status?.toUpperCase().trim() || ''; 
    const activeStatuses = [
        'EN_TRANSITO', 'EN_REPARTO', 'EN_PROCESO_ENVIO', 'ADUANA', 'TRANSIT',
        'LISTO_PARA_ENVIO', 'POR_ENVIAR', 'DESPACHADO', 'LISTO PARA ENVIO',
        'ENVIADO', 'SENT'
    ];
    const isActive = activeStatuses.includes(s) || activeStatuses.includes(s.replace(/\s+/g, '_'));
    return isActive && !isPickupPackage(pkg);
  }).length;

  const enDestinoCount = normalizedPackages.filter(pkg => {
    const s = pkg.status?.toUpperCase().trim() || '';
    const isDelivered = s === 'ENTREGADO' || s === 'DELIVERED' || s === 'COMPLETADO';
    return isDelivered && !isPickupPackage(pkg); 
  }).length;

  const activePackages = normalizedPackages.filter(pkg => {
    const s = pkg.status?.toUpperCase().trim() || '';
    return !['ENTREGADO', 'DELIVERED', 'CANCELADO', 'ENTREGADO_HISTORICO', 'EN_PROCESAMIENTO'].includes(s);
  });

  const pendingBills = await prisma.consolidatedShipment.findMany({
    where: { 
        userId: session.user.id, 
        status: { in: ['PENDIENTE_PAGO', 'PENDIENTE', 'CREATED', 'EN_ALMACEN'] } 
    },
    include: { packages: true }
  });

  const totalDebt = pendingBills.reduce((acc, s) => {
      let handlingFee = 0;

      const gmcNumber = s.gmcShipmentNumber?.toUpperCase() || '';
      const serviceType = s.serviceType?.toUpperCase() || '';
      const courierService = s.courierService?.toLowerCase() || '';
      const selectedCourier = s.selectedCourier?.toUpperCase() || ''; 

      // 🚢 OCEAN: Solo suma si ya tiene totalAmount confirmado (cliente seleccionó courier)
      const isOcean = serviceType === 'OCEAN_CONSOLIDATION';
      const oceanHasFinalPrice = isOcean && (s.totalAmount || 0) > 0;
      
      let finalSubtotal = isOcean 
          ? (oceanHasFinalPrice ? (s.totalAmount || 0) : 0)
          : (s.subtotalAmount || s.totalAmount || 0);

      const isIdPickup = gmcNumber.startsWith('PICKUP');
      const isStorage = serviceType === 'STORAGE_FEE' || serviceType.includes('STORAGE');
      const isDriverInvolved = courierService.includes('driver') || courierService.includes('chofer') || courierService.includes('domicilio');
      
      const isWarehousePickup = (
          isIdPickup || 
          serviceType === 'PICKUP' || 
          selectedCourier === 'CLIENTE_RETIRO' ||
          courierService.includes('cita') ||  
          courierService.includes('tienda') || 
          courierService.includes('bodega') || 
          (courierService.includes('pickup') && !isDriverInvolved)
      );

      if (isStorage) {
          handlingFee = 0; 
      } else if (isWarehousePickup && !isDriverInvolved) {
          let totalHandlingForPickup = 0;
          if (s.packages && s.packages.length > 0) {
              s.packages.forEach(pkg => {
                  const p = pkg as any; 
                  const weight = p.weightLbs || p.weight || p.peso || 1;
                  if (weight <= 10) totalHandlingForPickup += 2.50;
                  else if (weight <= 50) totalHandlingForPickup += 5.00;
                  else if (weight <= 150) totalHandlingForPickup += 12.50;
                  else totalHandlingForPickup += 30.00;
              });
          } else {
              totalHandlingForPickup = 2.50;
          }
          finalSubtotal = 0;
          handlingFee = totalHandlingForPickup;
      } else {
          handlingFee = 0;
      }

      return acc + (finalSubtotal + handlingFee);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
        <OneSignalInit userId={session.user.id} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ClientDashboard
                user={session.user as any}
                packages={activePackages}
                totalDebt={totalDebt}
                pendingBillsCount={pendingBills.length}
                pendingBillsRaw={pendingBills} 
                inTransitCount={inTransitCount}
                enDestinoCount={enDestinoCount}
                hasMailbox={hasMailbox}
                needsKycUpload={needsKycUpload}
                planType={resolvedPlanType}
                savedCards={savedCards}
            />
        </div>
    </div>
  );
}