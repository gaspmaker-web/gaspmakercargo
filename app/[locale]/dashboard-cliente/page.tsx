import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import ClientDashboard from "@/components/dashboard/ClientDashboard"; 

// 🔥 IMPORTAMOS TU NUEVA CALCULADORA GLOBAL
import { calculateHandlingFee } from '@/lib/utils'; 

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'Dashboard' });
  return { title: `${t('welcome', { name: '' })} | Gasp Maker Cargo` };
}

// --- CONFIGURACIÓN DE TARIFAS ---
const STORAGE_FREE_DAYS = 30;
const STORAGE_RATE_PER_CFT = 2.25;

// 🔥 FUNCIÓN DE CÁLCULO SINCRONIZADA
function calculateFees(pkg: any, t: any) {
    const now = new Date();
    const arrivalDate = new Date(pkg.createdAt);
    
    // 1. REVISIÓN CLAVE: ¿Hasta cuándo está pagado?
    const paidUntil = pkg.storagePaidUntil ? new Date(pkg.storagePaidUntil) : null;

    // Cálculo informativo de días totales
    const totalDiff = Math.abs(now.getTime() - arrivalDate.getTime());
    const daysInWarehouse = Math.ceil(totalDiff / (1000 * 60 * 60 * 24)); 

    // Medidas seguras (Fallback 12x12x10)
    const length = Number(pkg.lengthIn) || 12;
    const width = Number(pkg.widthIn) || 12;
    const height = Number(pkg.heightIn) || 10;
    
    // Volumen
    const volumeCft = (length * width * height) / 1728;

    let storageFee = 0;
    
    // 2. LÓGICA DE COBRO (Igual a la página de detalle)
    if (paidUntil) {
        // CASO A: TIENE FECHA DE PAGO (Ya pagó)
        const diffSincePaid = now.getTime() - paidUntil.getTime();
        const daysPending = Math.floor(diffSincePaid / (1000 * 60 * 60 * 24));

        if (daysPending > 0) {
            const dailyRate = (volumeCft * STORAGE_RATE_PER_CFT) / 30;
            storageFee = daysPending * dailyRate;
        } else {
            storageFee = 0; 
        }
    } else {
        // CASO B: NUNCA HA PAGADO
        if (daysInWarehouse > STORAGE_FREE_DAYS) {
            const chargeableDays = daysInWarehouse - STORAGE_FREE_DAYS;
            const monthlyCost = volumeCft * STORAGE_RATE_PER_CFT;
            const dailyRate = monthlyCost / 30;
            storageFee = chargeableDays * dailyRate;
        }
    }

    // 🔥 APLICAMOS LA NUEVA LÓGICA DE MANEJO ENTERPRISE
    // Para que los sobres de Documentos Físicos del Buzón sean GRATIS (Handling $0.00)
    let handlingFee = 0;
    if (pkg.description === "Documento Físico (Enviado desde Buzón)") {
        handlingFee = 0;
    } else {
        // Si es un paquete normal, usamos nuestra nueva función importada
        handlingFee = calculateHandlingFee(pkg.weightLbs);
    }

    return {
        ...pkg,
        carrierTrackingNumber: pkg.carrierTrackingNumber || pkg.gmcTrackingNumber,

        // 🔥 INTERCEPTOR MULTILINGÜE
        description: pkg.description === "Documento Físico (Enviado desde Buzón)" 
                     ? t('physicalDocument') 
                     : (pkg.description || (pkg.gmcTrackingNumber?.startsWith('GMC') ? 'Pickup Procesado' : t('noDescription'))),
        daysInWarehouse,
        storageFee: parseFloat(storageFee.toFixed(2)),       
        pickupHandlingFee: parseFloat(handlingFee.toFixed(2)), 
        storageDebt: parseFloat(storageFee.toFixed(2)), 
        volumeCft: parseFloat(volumeCft.toFixed(2)),
        isBlocked: storageFee > 0.01 
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

  // -------------------------------------------------------------------------
  // 🔥 NUEVA LÓGICA: VERIFICACIÓN DEL BUZÓN VIRTUAL (MAILBOX) Y KYC
  // -------------------------------------------------------------------------
  const mailboxSubscription = await prisma.mailboxSubscription.findUnique({
    where: { userId: session.user.id }
  });

  // Evaluamos el estado exacto del cliente para el Buzón
  const hasMailbox = !!mailboxSubscription;
  const isKycMissing = mailboxSubscription?.status === 'PENDING_USPS' && !mailboxSubscription.uspsForm1583Url;
  const isKycRejected = mailboxSubscription?.status === 'REJECTED';
  
  // Extraemos el plan para el Upselling
  const planType = mailboxSubscription?.planType || null; 

  // Combinamos si falta KYC o si fue rechazado (ambos requieren subir archivos)
  const needsKycUpload = isKycMissing || isKycRejected;

  // 🔥 1. BUSCAMOS LAS TARJETAS GUARDADAS DEL CLIENTE
  const savedCards = await prisma.paymentMethod.findMany({
    where: { userId: session.user.id }
  });

  // 1. Obtener Paquetes
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

  // 1.5 🔥 INICIALIZAR EL TRADUCTOR
  const t = await getTranslations({ locale, namespace: 'Dashboard' });

  // 2. Normalizar y Calcular (Aplicando la lógica)
  const normalizedPackages = allPackages.map(pkg => calculateFees(pkg, t));

  // --- FILTROS DE CONTADORES CORREGIDOS ---

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

  // 3. Deuda Global
  const pendingBills = await prisma.consolidatedShipment.findMany({
    where: { userId: session.user.id, status: 'PENDIENTE_PAGO' },
    include: { packages: true }
  });

  const totalDebt = pendingBills.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
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
                planType={planType} 
                // 🔥 2. LE PASAMOS LAS TARJETAS AL DASHBOARD
                savedCards={savedCards}
            />
        </div>
    </div>
  );
}