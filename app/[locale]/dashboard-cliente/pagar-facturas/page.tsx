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

  // 1. Obtener Perfil (Dirección para facturación)
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

  // 2. BUSCAR CONSOLIDACIONES PENDIENTES
  // ⚠️ Nota: Asegúrate que los status coincidan con lo que guarda tu Admin API ('EN_ALMACEN')
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
    
    // A. DETECTAR SI ES "ENTREGAR EN TIENDA" (STORE PICKUP)
    // Buscamos si el tipo es PICKUP o si el texto del courier dice "Pickup"
    let isStorePickup = false;
    let displayService = s.courierService;

    if (s.serviceType === 'PICKUP' || s.courierService?.toLowerCase().includes('pickup')) {
        displayService = 'Entregar en Tienda'; // Forzamos el nombre correcto
        isStorePickup = true;
    }
    
    // B. DETECTAR SI ES INTERNACIONAL
    // Si NO es Pickup Local y NO es Almacenaje, asumimos que es Envío Internacional
    const isInternationalType = !s.serviceType?.includes('PICKUP') && !s.serviceType?.includes('STORAGE');
    
    // C. CALCULAR HANDLING FEE
    // Regla de Oro: Solo cobramos los $10 si es Internacional Y NO es retiro en tienda.
    let handlingFee = 0;

    if (isInternationalType && !isStorePickup) {
        handlingFee = INTERNATIONAL_HANDLING_FEE;
    }

    // D. CALCULAR TOTAL FINAL
    const currentTotal = s.totalAmount || 0;
    const finalTotalAmount = currentTotal + handlingFee;

    return {
      id: s.id,
      type: 'CONSOLIDATION',
      
      description: `Consolidación #${s.gmcShipmentNumber || s.id.slice(0, 8).toUpperCase()}`,
      gmcShipmentNumber: s.gmcShipmentNumber,
      createdAt: s.createdAt,
      
      // --- MONTOS AJUSTADOS ---
      totalAmount: finalTotalAmount, 
      subtotalAmount: s.subtotalAmount || 0,
      handlingFee: handlingFee,      
      
      // 🔥 AQUÍ AGREGAMOS LA LÍNEA CRÍTICA PARA EL SEGURO
      declaredValue: s.declaredValue || 0,

      weightLbs: s.weightLbs || 0,
      lengthIn: s.lengthIn || 0,
      widthIn: s.widthIn || 0,
      heightIn: s.heightIn || 0,
      
      packages: s.packages,
      selectedCourier: s.selectedCourier,
      courierService: displayService // ✅ Enviamos 'Entregar en Tienda' corregido
    };
  });

  const userProfile = {
    name: user?.name || '',
    address: user?.address || '',
    cityZip: user?.cityZip || '',
    countryCode: user?.country || user?.countryCode || 'DO', 
    phone: user?.phone || ''
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 font-montserrat">
        <PendingBillsClient 
            bills={bills} 
            locale={locale} 
            userProfile={userProfile} 
        />
    </div>
  );
}