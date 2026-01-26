import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
// Importamos tu componente original
import PackageDetailClient from '@/components/PackageDetailClient';
// 👇 IMPORTAMOS EL COMPONENTE DE BLOQUEO INTERACTIVO
import StorageLockScreen from '@/components/client/StorageLockScreen';

// IMPORTS PARA ENTREGADOS
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, CheckCircle, Calendar, User, Camera, PenTool, Box, Truck } from 'lucide-react';
// 🔥 NUEVO: Import para traducciones en Server Components
import { getTranslations } from 'next-intl/server';

interface Props {
  params: {
    id: string;
    locale: string;
  };
}

// ⚙️ CONFIGURACIÓN DE TARIFAS
const STORAGE_FREE_DAYS = 30;         
const STORAGE_RATE_PER_CFT = 2.25;    
const INTERNATIONAL_HANDLING_FEE = 10.00;

export const dynamic = 'force-dynamic';

export default async function PackageDetailPage({ params }: Props) {
  const session = await auth();
  
  // 🔥 INICIALIZAR TRADUCCIONES (Namespace: PackageDetail)
  const t = await getTranslations({ locale: params.locale, namespace: 'PackageDetail' });

  if (!session?.user) {
    redirect('/login-cliente');
  }

  // 1. Buscar el paquete
  const pkg = await prisma.package.findUnique({
    where: { id: params.id },
    include: {
        user: { 
          select: { name: true, address: true, cityZip: true, countryCode: true, country: true, phone: true } 
        }
    }
  });

  if (!pkg || pkg.userId !== session.user.id) {
    return <div className="p-10 text-center font-bold text-red-500">Acceso Denegado</div>;
  }

  // 2. BUSCAR MÉTODOS DE PAGO (Necesario para el modal de pago)
  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { userId: session.user.id },
    orderBy: { isDefault: 'desc' },
    select: { id: true, brand: true, last4: true }
  });

  // =================================================================================
  // 🧠 CÁLCULO DE ALMACENAJE (CORREGIDO: RESPETA PAGOS PREVIOS)
  // =================================================================================
  const now = new Date();
  const created = new Date(pkg.createdAt);
  
  // 🔥 CLAVE: Revisamos si ya existe una fecha de pago en la BD
  const paidUntil = pkg.storagePaidUntil ? new Date(pkg.storagePaidUntil) : null;

  // Días totales desde que llegó (informativo)
  const diffTimeTotal = Math.abs(now.getTime() - created.getTime());
  const daysInWarehouse = Math.ceil(diffTimeTotal / (1000 * 60 * 60 * 24));
  
  let storageDebt = 0;
  let overdueDays = 0;
  
  const isDelivered = [
      'ENTREGADO', 'DELIVERED', 'COMPLETADO', 'ENTREGADO_HISTORICO', 'CANCELADO'
  ].includes(pkg.status);
  
  // Medidas y Volumen
  const length = Number(pkg.lengthIn) || 12; 
  const width = Number(pkg.widthIn) || 12;
  const height = Number(pkg.heightIn) || 10;

  const cubicFeet = (length * width * height) / 1728;
  const monthlyCost = STORAGE_RATE_PER_CFT * cubicFeet;
  const dailyRate = monthlyCost / 30;

  // 🔥 LÓGICA DE COBRO INTELIGENTE
  if (!isDelivered) {
      if (paidUntil) {
          // CASO A: YA SE PAGÓ ANTES (O RECIENTEMENTE)
          // Verificamos cuánto tiempo ha pasado DESDE la última fecha pagada
          const diffSincePaid = now.getTime() - paidUntil.getTime();
          
          // Convertimos a días. Si es negativo o 0, significa que aún estás cubierto.
          // Usamos floor para no cobrar el mismo día del pago.
          const daysSincePaid = Math.floor(diffSincePaid / (1000 * 60 * 60 * 24));

          if (daysSincePaid > 0) {
              overdueDays = daysSincePaid;
              storageDebt = overdueDays * dailyRate;
          } else {
              // Si acabas de pagar (o pagaste por adelantado), deuda es 0
              storageDebt = 0;
              overdueDays = 0;
          }
      } else {
          // CASO B: NUNCA SE HA PAGADO (paidUntil es null)
          // Aplicamos la regla normal de los 30 días gratis desde la creación
          if (daysInWarehouse > STORAGE_FREE_DAYS) {
              overdueDays = daysInWarehouse - STORAGE_FREE_DAYS;
              storageDebt = overdueDays * dailyRate;
          }
      }
  }

  // ---------------------------------------------------------
  // 🛑 DEBUGGING (Mira esto en tu terminal)
  // ---------------------------------------------------------
  console.log(`--- 📦 DEBUG ${pkg.gmcTrackingNumber} ---`);
  console.log(`Creado: ${created.toISOString()}`);
  console.log(`Pagado Hasta (BD): ${paidUntil ? paidUntil.toISOString() : 'NUNCA'}`);
  console.log(`Deuda Calculada Ahora: $${storageDebt.toFixed(2)}`);
  // ---------------------------------------------------------

  // =================================================================================
  // 🔒 PANTALLA DE BLOQUEO (INTERACTIVA)
  // =================================================================================
  // Solo mostramos bloqueo si la deuda es real (mayor a 1 centavo)
  if (storageDebt > 0.01) { 
      return (
        <StorageLockScreen 
            pkg={pkg}
            daysInWarehouse={daysInWarehouse}
            overdueDays={overdueDays}
            cubicFeet={cubicFeet}
            storageDebt={storageDebt}
            storageFreeDays={STORAGE_FREE_DAYS}
            paymentMethods={paymentMethods}
        />
      );
  }

  // =================================================================================
  // ✅ PANTALLA ENTREGADO (HISTÓRICO) - DISEÑO MEJORADO Y TRADUCIDO
  // =================================================================================
  if (isDelivered) {
    return (
      <div className="min-h-screen bg-white p-4 sm:p-6 font-montserrat flex justify-center">
        <div className="max-w-xl w-full space-y-6 mt-6">
          
          {/* TARJETA DE ESTADO (Colores Suaves y Profesionales) */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center shadow-sm">
              <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-green-100">
                  <CheckCircle size={32} className="text-green-600" />
              </div>
              {/* TRADUCCIÓN APLICADA: 'deliveredTitle' */}
              <h1 className="text-2xl font-bold uppercase tracking-wide text-green-800">
                {t('deliveredTitle')} 
              </h1>
              <p className="font-mono text-lg text-green-700 mt-1">{pkg.gmcTrackingNumber}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              {/* TRADUCCIÓN APLICADA: 'proofPhoto' */}
              <h3 className="text-sm font-bold text-gray-700 uppercase mb-4 flex items-center gap-2">
                  <Camera size={18} className="text-gmc-dorado-principal"/> {t('proofPhoto')}
              </h3>
              <div className="rounded-xl overflow-hidden bg-gray-50 border border-gray-200">
                  {pkg.deliveryPhotoUrl ? (
                      <div className="relative w-full h-64 md:h-80">
                          <Image src={pkg.deliveryPhotoUrl} alt="Evidencia" fill className="object-cover"/>
                      </div>
                  ) : (
                      <div className="h-40 flex flex-col items-center justify-center text-gray-400">
                          <Camera size={32} className="opacity-20 mb-2"/>
                          {/* TRADUCCIÓN APLICADA: 'noPhoto' */}
                          <p className="text-xs italic">{t('noPhoto') || "No hay foto disponible"}</p>
                      </div>
                  )}
              </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              {/* TRADUCCIÓN APLICADA: 'signatureTitle' */}
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                  <PenTool size={16} className="text-gmc-dorado-principal"/> {t('signatureTitle')}
              </h3>
              <div className="border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 p-6 flex flex-col items-center justify-center h-48">
                  {pkg.deliverySignature ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={pkg.deliverySignature} alt="Firma" className="max-h-full max-w-full object-contain contrast-125"/>
                  ) : (
                      <div className="text-center text-gray-400">
                          <PenTool size={32} className="mx-auto mb-2 opacity-20"/>
                          {/* TRADUCCIÓN APLICADA: 'noSignature' */}
                          <p className="text-xs italic">{t('noSignature') || "No se registró firma digital"}</p>
                      </div>
                  )}
                  {/* TRADUCCIÓN APLICADA: 'signedDigitally' */}
                  <p className="text-[10px] text-gray-400 font-mono mt-4 uppercase tracking-widest">{t('signedDigitally') || "Firmado Digitalmente"}</p>
              </div>
          </div>
        </div>
      </div>
    );
  }

  // =================================================================================
  // ⚡️ FLUJO NORMAL (LIBERADO)
  // =================================================================================
  
  // Normalización de datos
  const isPickup = pkg.gmcTrackingNumber?.startsWith('GMC') || pkg.description?.toLowerCase().includes('pickup');
  const handlingFee = isPickup ? 0 : INTERNATIONAL_HANDLING_FEE;
  
  const finalCountryCode = (pkg.user?.countryCode || 'US') === 'TT' || (pkg.user?.country || '').toLowerCase().includes('trinidad') ? 'TT' : (pkg.user?.countryCode || 'US');
  const finalCountryName = pkg.user?.country || 'United States';

  const normalizedPkg = {
      ...pkg,
      carrierTrackingNumber: pkg.carrierTrackingNumber || pkg.gmcTrackingNumber || 'S/N',
      courier: pkg.courier || (isPickup ? 'Gasp Maker Cargo' : 'Courier Desconocido'),
      description: pkg.description || (isPickup ? 'Pickup en Bodega' : 'Paquete sin descripción'),
      handlingFee: handlingFee 
  };

  const userProfile = {
      name: pkg.user?.name || session.user.name || '',
      address: pkg.user?.address || '',
      cityZip: pkg.user?.cityZip || '',
      countryCode: finalCountryCode,
      countryName: finalCountryName,
      phone: pkg.user?.phone || ''
  };

  return (
    <PackageDetailClient 
      pkg={normalizedPkg} 
      userProfile={userProfile} 
      savedCards={paymentMethods} 
    />
  );
}