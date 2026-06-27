import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import PendingBillsClient from '@/components/dashboard/PendingBillsClient';

export const metadata = {
  title: 'Pagar Facturas | Gasp Maker Cargo',
};

export default async function PagarFacturasPage({ params: { locale } }: { params: { locale: string } }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login-cliente');
  }

 // 1. Obtener Perfil Viejo (Respaldo) + 🔥 CAMPOS DE RECOMPENSAS Y VIP
  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  const userPlan = (user as any)?.planType;

  // 🔥 NUEVO: Traemos TODAS las direcciones de la nueva libreta, ordenando la DEFAULT primero
  const userAddresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  const defaultAddress = userAddresses.length > 0 ? userAddresses[0] : null;

  // 2. BUSCAR CONSOLIDACIONES PENDIENTES
  const pendingShipments = await prisma.consolidatedShipment.findMany({
    where: {
      userId: session.user.id,
      status: { in: ['PENDIENTE_PAGO', 'PENDIENTE', 'CREATED', 'EN_ALMACEN'] }, 
    },
    include: {
      packages: true 
    },
    orderBy: { updatedAt: 'desc' }
  });

  // 3. MAPEAR DATOS (CON LA CORRECCIÓN DE LÓGICA DE NEGOCIO)
  const bills = pendingShipments.map(s => {
    
    // =========================================================================
    // 🛡️ LÓGICA BLINDADA: SEPARAR PICKUP, STORAGE, AURA, MARÍTIMO Y ENVÍO
    // =========================================================================
    
    let type = 'CONSOLIDATION';
    let displayService = s.courierService || 'Envío';
    let handlingFee = 0;
    let finalSubtotal = s.subtotalAmount || 0;

    // 1. Identificadores
    const isIdPickup = s.gmcShipmentNumber?.toUpperCase().startsWith('PICKUP');
    const isServicePickup = s.serviceType === 'PICKUP' || s.courierService?.toLowerCase().includes('pickup') || s.courierService?.toLowerCase().includes('cita');
    const isStorage = s.serviceType === 'STORAGE_FEE' || s.serviceType?.includes('STORAGE');
    
    // 🚀 NUEVO: Detectar si es Aura (Local Delivery) o Marítimo (Ocean)
    const isLocalDelivery = s.serviceType === 'LOCAL_DELIVERY';
    const isOcean = s.serviceType === 'OCEAN_CONSOLIDATION';

    if (isIdPickup || isServicePickup) {
        // 🏬 ESCENARIO 1: RETIRO EN BODEGA
        type = 'WAREHOUSE_PICKUP';
        displayService = 'Retiro en Bodega';

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
        }
        
        finalSubtotal = 0; 
        handlingFee = totalHandlingForPickup;
        
    } else if (isStorage) {
        // 📦 ESCENARIO 2: PAGO DE ALMACENAJE
        type = 'STORAGE';
        displayService = 'Cargo por Almacenaje';
        handlingFee = 0; 
        
    } else if (isLocalDelivery) {
        // 🚚 ESCENARIO 3: AURA LOCAL DELIVERY
        type = 'LOCAL_DELIVERY';
        displayService = 'Entrega Local (Aura)';
        handlingFee = 0;

    } else if (isOcean) {
        // 🚢 ESCENARIO 4: CONSOLIDACIÓN MARÍTIMA (NUEVO)
        type = 'OCEAN_CONSOLIDATION';
        displayService = 'Consolidación Marítima';
        handlingFee = 0; 

    } else {
        // ✈️ ESCENARIO 5: ENVÍO INTERNACIONAL / CONSOLIDACIÓN (AÉREO)
        type = 'CONSOLIDATION';
        handlingFee = 0;
    }

    // Calcular Total Final
    const finalTotalAmount = finalSubtotal + handlingFee;

    // Etiqueta visual
    const labelId = s.gmcShipmentNumber || s.id.slice(0, 8).toUpperCase();
    let typeLabel = 'Consolidación';
    if (type === 'WAREHOUSE_PICKUP') typeLabel = 'Solicitud de Retiro';
    if (type === 'STORAGE') typeLabel = 'Cargo por Almacenaje';
    if (type === 'LOCAL_DELIVERY') typeLabel = 'Consolidación Local (Aura)'; 
    if (type === 'OCEAN_CONSOLIDATION') typeLabel = 'Consolidación Marítima'; 

    // =========================================================================
    // 🔥 EXTRACCIÓN INTELIGENTE DE PESO Y MEDIDAS (SOPORTE PARA MÚLTIPLES PALLETS)
    // =========================================================================
    let globalWeight = s.weightLbs || 0;
    
    // Si la consolidación tiene pallets anidados en JSON, sumamos su peso real para el frontend
    if (s.auraDetails) {
        try {
            const auraList = typeof s.auraDetails === 'string' ? JSON.parse(s.auraDetails) : s.auraDetails;
            if (Array.isArray(auraList) && auraList.length > 0) {
                globalWeight = auraList.reduce((acc: number, item: any) => acc + (parseFloat(item.weight) || 0), 0);
            }
        } catch(e) {
            console.error("Error parseando auraDetails", e);
        }
    }

    return {
      id: s.id,
      type: type, 
      description: `${typeLabel} #${labelId}`,
      gmcShipmentNumber: s.gmcShipmentNumber,
      createdAt: s.createdAt,
      
      totalAmount: finalTotalAmount, 
      subtotalAmount: finalSubtotal,
      handlingFee: handlingFee,      
      
      declaredValue: s.declaredValue || 0,
      
      // 🔥 MANDAMOS EL PESO GLOBAL COMBINADO
      weightLbs: globalWeight,
      
      lengthIn: s.lengthIn || 0,
      widthIn: s.widthIn || 0,
      heightIn: s.heightIn || 0,
      
      // 🚀 DATOS CRUCIALES PARA MÚLTIPLES PALLETS
      serviceType: s.serviceType,
      auraDetails: s.auraDetails, 
      
      extraCharges: s.extraCharges,

      packages: s.packages,
      selectedCourier: s.selectedCourier,
      courierService: displayService 
    };
  });

  const userProfile = {
    name: defaultAddress?.fullName || user?.name || '',
    address: defaultAddress?.address || user?.address || '',
    cityZip: defaultAddress?.cityZip || user?.cityZip || '',
    countryCode: defaultAddress?.country || user?.country || user?.countryCode || 'US', 
    phone: defaultAddress?.phone || user?.phone || '',
    referredBy: user?.referredBy || null,
    referralRewardPaid: user?.referralRewardPaid || false,
    walletBalance: user?.walletBalance || 0,
    // 🔥 EXENCIÓN DE FEE DE CONSOLIDACIÓN
    noConsolidationFee: user?.noConsolidationFee || false,
};

return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 font-montserrat">
        <PendingBillsClient 
            bills={bills} 
            locale={locale} 
            userProfile={userProfile} 
            allAddresses={userAddresses} 
            planType={userPlan}
        />
    </div>
  );
}