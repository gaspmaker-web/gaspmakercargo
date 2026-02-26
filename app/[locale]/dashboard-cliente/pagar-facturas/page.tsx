import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import PendingBillsClient from '@/components/dashboard/PendingBillsClient';

export const metadata = {
  title: 'Pagar Facturas | Gasp Maker Cargo',
};

// 💰 CONSTANTE: Fee de Manejo (Solo para internacionales)
const INTERNATIONAL_HANDLING_FEE = 10.00;

export default async function PagarFacturasPage({ params: { locale } }: { params: { locale: string } }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login-cliente');
  }

  // 1. Obtener Perfil Viejo (Respaldo)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      address: true,
      cityZip: true,
      countryCode: true,
      country: true,
      phone: true
    }
  });

  // 🔥 NUEVO: Traemos TODAS las direcciones de la nueva libreta, ordenando la DEFAULT primero
  const userAddresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  // Definimos la dirección principal
  const defaultAddress = userAddresses.length > 0 ? userAddresses[0] : null;

  // 2. BUSCAR CONSOLIDACIONES PENDIENTES
  // ⚠️ Nota: Asegúrate que los status coincidan con lo que guarda tu Admin API
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
    // 🛡️ LÓGICA BLINDADA PARA DETECTAR PICKUP / RETIRO
    // =========================================================================
    
    let isStorePickup = false;
    let displayService = s.courierService || 'Envío';

    // 1. Verificar por ID (Si empieza con PICKUP)
    const isIdPickup = s.gmcShipmentNumber?.toUpperCase().startsWith('PICKUP');
    
    // 2. Verificar por Tipo de Servicio (Backend usa STORAGE_FEE para pickups)
    const isTypeStorage = s.serviceType === 'STORAGE_FEE' || s.serviceType?.includes('STORAGE') || s.serviceType === 'PICKUP';
    
    // 3. Verificar por Texto del servicio (Por si acaso dice 'Cita' o 'Pickup')
    const isServiceTextPickup = s.courierService?.toLowerCase().includes('pickup') || s.courierService?.toLowerCase().includes('cita');

    // SI CUMPLE CUALQUIERA, ES UN RETIRO
    if (isIdPickup || isTypeStorage || isServiceTextPickup) {
        displayService = 'Retiro en Bodega'; // Forzamos el nombre correcto
        isStorePickup = true;
    }
    
    // =========================================================================
    // 💰 CÁLCULO DE FEES
    // =========================================================================
    
    // Regla de Oro: Solo cobramos los $10 si NO es retiro en tienda.
    let handlingFee = 0;

    if (!isStorePickup) {
        // Solo aplicamos el fee si es un envío internacional real
        handlingFee = INTERNATIONAL_HANDLING_FEE;
    }

    // Calcular Total Final
    const currentTotal = s.totalAmount || 0;
    
    // IMPORTANTE: Si la factura ya incluía el fee en la BD, no lo sumamos de nuevo visualmente
    // Pero como estamos recalculando 'handlingFee' para mostrarlo separado, asumimos que 's.totalAmount'
    // viene limpio o ajustamos según tu lógica de base de datos.
    // Para seguridad visual: Total = Subtotal BD + Fee Calculado Aquí
    const finalTotalAmount = (s.subtotalAmount || currentTotal) + handlingFee;

    // Etiqueta visual
    const labelId = s.gmcShipmentNumber || s.id.slice(0, 8).toUpperCase();
    const typeLabel = isStorePickup ? 'Solicitud de Retiro' : 'Consolidación';

    return {
      id: s.id,
      type: isStorePickup ? 'WAREHOUSE_PICKUP' : 'CONSOLIDATION',
      
      description: `${typeLabel} #${labelId}`,
      gmcShipmentNumber: s.gmcShipmentNumber,
      createdAt: s.createdAt,
      
      // --- MONTOS AJUSTADOS ---
      // Usamos el subtotal base de la BD y le sumamos el fee calculado dinámicamente
      totalAmount: finalTotalAmount, 
      subtotalAmount: s.subtotalAmount || 0,
      handlingFee: handlingFee,      
      
      declaredValue: s.declaredValue || 0,

      weightLbs: s.weightLbs || 0,
      lengthIn: s.lengthIn || 0,
      widthIn: s.widthIn || 0,
      heightIn: s.heightIn || 0,
      
      packages: s.packages,
      selectedCourier: s.selectedCourier,
      courierService: displayService 
    };
  });

  // 🔥 DATOS LIMPIOS: Priorizamos la nueva libreta, si está vacía usamos el perfil viejo
  const userProfile = {
    name: defaultAddress?.fullName || user?.name || '',
    address: defaultAddress?.address || user?.address || '',
    cityZip: defaultAddress?.cityZip || user?.cityZip || '',
    // Usamos el country de la libreta, o el del perfil viejo
    countryCode: defaultAddress?.country || user?.country || user?.countryCode || 'US', 
    phone: defaultAddress?.phone || user?.phone || ''
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 font-montserrat">
        <PendingBillsClient 
            bills={bills} 
            locale={locale} 
            userProfile={userProfile} 
            // 🔥 Le mandamos la libreta completa a la pantalla para crear el menú desplegable
            allAddresses={userAddresses} 
        />
    </div>
  );
}