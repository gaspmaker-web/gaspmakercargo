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

  // 1. Obtener Perfil Viejo (Respaldo) + 🔥 CAMPOS DE RECOMPENSAS
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      address: true,
      cityZip: true,
      countryCode: true,
      country: true,
      phone: true,
      // 👇 ¡AQUÍ ESTÁ LA MAGIA QUE FALTABA!
      referredBy: true,          
      referralRewardPaid: true,  
      walletBalance: true,
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
    
   // 3. MAPEAR DATOS (CON LA CORRECCIÓN DE LÓGICA DE NEGOCIO)
  const bills = pendingShipments.map(s => {
    
    // =========================================================================
    // 🛡️ LÓGICA BLINDADA: SEPARAR PICKUP, STORAGE Y ENVÍO
    // =========================================================================
    
    let type = 'CONSOLIDATION';
    let displayService = s.courierService || 'Envío';
    let handlingFee = 0;
    let finalSubtotal = s.subtotalAmount || 0;

    // 1. Identificadores
    const isIdPickup = s.gmcShipmentNumber?.toUpperCase().startsWith('PICKUP');
    const isServicePickup = s.serviceType === 'PICKUP' || s.courierService?.toLowerCase().includes('pickup') || s.courierService?.toLowerCase().includes('cita');
    
    // 🚨 CRÍTICO: Detectar si es un cobro de Almacenaje (Storage)
    const isStorage = s.serviceType === 'STORAGE_FEE' || s.serviceType?.includes('STORAGE');

    if (isStorage) {
        // 📦 ESCENARIO 1: PAGO DE ALMACENAJE (Imágenes op40 y op41)
        type = 'STORAGE';
        displayService = 'Cargo por Almacenaje';
        // Se respeta intacto el finalSubtotal que viene de la BD (ej. los $3.45 por el volumen)
        handlingFee = 0; 
        
    } else if (isIdPickup || isServicePickup) {
        // 🏬 ESCENARIO 2: RETIRO EN BODEGA (Imagen op39)
        type = 'WAREHOUSE_PICKUP';
        displayService = 'Retiro en Bodega';

        // Aplicamos la tabla In-Out por paquete
        let totalHandlingForPickup = 0;
        if (s.packages && s.packages.length > 0) {
            s.packages.forEach(pkg => {
                const weight = pkg.weight || pkg.peso || 1;
                if (weight <= 10) totalHandlingForPickup += 2.50;
                else if (weight <= 50) totalHandlingForPickup += 5.00;
                else if (weight <= 150) totalHandlingForPickup += 12.50;
                else totalHandlingForPickup += 30.00;
            });
        }
        
        finalSubtotal = 0; // El flete es 0 porque vienen a buscarlo
        handlingFee = totalHandlingForPickup;
        
    } else {
        // ✈️ ESCENARIO 3: ENVÍO INTERNACIONAL / CONSOLIDACIÓN
        type = 'CONSOLIDATION';
        // YA NO SE COBRAN LOS $10 DE HANDLING FEE. 
        handlingFee = 0;
        // Se respeta el costo de flete original que calculó el admin (finalSubtotal)
    }

    // Calcular Total Final
    const finalTotalAmount = finalSubtotal + handlingFee;

    // Etiqueta visual
    const labelId = s.gmcShipmentNumber || s.id.slice(0, 8).toUpperCase();
    let typeLabel = 'Consolidación';
    if (type === 'WAREHOUSE_PICKUP') typeLabel = 'Solicitud de Retiro';
    if (type === 'STORAGE') typeLabel = 'Cargo por Almacenaje';

    return {
      id: s.id,
      type: type,
      description: `${typeLabel} #${labelId}`,
      gmcShipmentNumber: s.gmcShipmentNumber,
      createdAt: s.createdAt,
      
      // --- MONTOS AJUSTADOS ---
      totalAmount: finalTotalAmount, 
      subtotalAmount: finalSubtotal,
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
    countryCode: defaultAddress?.country || user?.country || user?.countryCode || 'US', 
    phone: defaultAddress?.phone || user?.phone || '',
    // 👇 ¡PASANDO LOS DATOS DE RECOMPENSA AL FRONTEND!
    referredBy: user?.referredBy || null,
    referralRewardPaid: user?.referralRewardPaid || false,
    walletBalance: user?.walletBalance || 0,
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