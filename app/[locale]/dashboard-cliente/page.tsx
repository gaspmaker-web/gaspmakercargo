import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import ClientDashboard from "@/components/dashboard/ClientDashboard"; 

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'Dashboard' });
  return { title: `${t('welcome', { name: '' })} | Gasp Maker Cargo` };
}

// --- CONFIGURACIÓN DE TARIFAS ---
const STORAGE_FREE_DAYS = 30;
const STORAGE_RATE_PER_CFT = 2.25;

// 🔥 FUNCIÓN DE CÁLCULO SINCRONIZADA
// Esta función ahora mira 'storagePaidUntil'. Si ya pagaste, pone la deuda en 0.
function calculateFees(pkg: any) {
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
        // Calculamos tiempo desde el último pago
        const diffSincePaid = now.getTime() - paidUntil.getTime();
        const daysPending = Math.floor(diffSincePaid / (1000 * 60 * 60 * 24));

        if (daysPending > 0) {
            // Si pasaron días DESPUÉS del pago, cobramos eso.
            const dailyRate = (volumeCft * STORAGE_RATE_PER_CFT) / 30;
            storageFee = daysPending * dailyRate;
        } else {
            // Si pagó hoy o la fecha es futura, DEUDA ES CERO.
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

    // Lógica de manejo
    let handlingFee = 0;
    const w = pkg.weightLbs || 0;
    if (w <= 50) handlingFee = 5.00;
    else if (w <= 150) handlingFee = 15.00;
    else handlingFee = 35.00;

    return {
        ...pkg,
        carrierTrackingNumber: pkg.carrierTrackingNumber || pkg.gmcTrackingNumber,
        description: pkg.description || (pkg.gmcTrackingNumber?.startsWith('GMC') ? 'Pickup Procesado' : 'Paquete sin descripción'),
        daysInWarehouse,
        storageFee: parseFloat(storageFee.toFixed(2)),       // Aquí irá el $0.00
        pickupHandlingFee: parseFloat(handlingFee.toFixed(2)), 
        storageDebt: parseFloat(storageFee.toFixed(2)), 
        volumeCft: parseFloat(volumeCft.toFixed(2)),
        // 🔥 BLOQUEO: Solo si hay deuda REAL hoy
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

  // 1. Obtener Paquetes
  // Prisma trae 'storagePaidUntil' automáticamente al ser un campo del modelo Package
  const allPackages = await prisma.package.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
        consolidatedShipment: {
            select: { 
                serviceType: true,
                courierService: true // Necesario para detectar "Entregar en Tienda"
            }
        }
    }
  });

  // 2. Normalizar y Calcular (Aplicando la nueva lógica)
  const normalizedPackages = allPackages.map(pkg => calculateFees(pkg));

  // --- FILTROS DE CONTADORES CORREGIDOS ---

  // Helper para detectar Pickup
  const isPickupPackage = (pkg: any) => {
      const isClientRetiro = pkg.selectedCourier === 'CLIENTE_RETIRO';
      const isServicePickup = pkg.courierService?.toUpperCase().includes('PICKUP') || 
                              pkg.courierService?.toUpperCase().includes('RECOGIDA') || 
                              pkg.courierService?.toUpperCase().includes('TIENDA');
      
      const isConsolidatedPickup = pkg.consolidatedShipment?.serviceType === 'PICKUP' || 
                                   pkg.consolidatedShipment?.courierService?.toUpperCase().includes('TIENDA');

      return isClientRetiro || isServicePickup || isConsolidatedPickup;
  };

  // A. EN TRÁNSITO (Excluyendo Pickups)
  const inTransitCount = normalizedPackages.filter(pkg => {
    const s = pkg.status?.toUpperCase().trim() || ''; 
    const activeStatuses = [
        'EN_TRANSITO', 'EN_REPARTO', 'EN_PROCESO_ENVIO', 'ADUANA', 'TRANSIT',
        'LISTO_PARA_ENVIO', 'POR_ENVIAR', 'DESPACHADO', 'LISTO PARA ENVIO',
        'ENVIADO', 'SENT'
    ];
    const isActive = activeStatuses.includes(s) || activeStatuses.includes(s.replace(/\s+/g, '_'));
    
    // 🔥 FILTRO: Si es Pickup, NO cuenta como tránsito
    return isActive && !isPickupPackage(pkg);
  }).length;

  // B. EN DESTINO (Excluyendo Pickups)
  const enDestinoCount = normalizedPackages.filter(pkg => {
    const s = pkg.status?.toUpperCase().trim() || '';
    const isDelivered = s === 'ENTREGADO' || s === 'DELIVERED' || s === 'COMPLETADO';
    
    // 🔥 FILTRO: Si es Pickup, NO cuenta como entrega a domicilio
    return isDelivered && !isPickupPackage(pkg); 
  }).length;

  // C. PAQUETES ACTIVOS (Bodega)
  const activePackages = normalizedPackages.filter(pkg => {
    const s = pkg.status?.toUpperCase().trim() || '';
    return !['ENTREGADO', 'DELIVERED', 'CANCELADO', 'ENTREGADO_HISTORICO', 'EN_PROCESAMIENTO'].includes(s);
  });

  // 3. Deuda Global (Solo facturas pendientes de pago)
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
            />
        </div>
    </div>
  );
} 