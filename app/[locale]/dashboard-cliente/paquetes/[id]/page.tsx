import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import PackageDetailClient from '@/components/PackageDetailClient';
import StorageLockScreen from '@/components/client/StorageLockScreen';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, CheckCircle, Calendar, User, Camera, PenTool, Box, Truck } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

interface Props {
  params: {
    id: string;
    locale: string;
  };
}

const STORAGE_FREE_DAYS = 30;         
const STORAGE_RATE_PER_CFT = 2.25;    
const INTERNATIONAL_HANDLING_FEE = 10.00;

export const dynamic = 'force-dynamic';

export default async function PackageDetailPage({ params }: Props) {
  const session = await auth();
  const t = await getTranslations({ locale: params.locale, namespace: 'PackageDetail' });

  if (!session?.user) {
    redirect('/login-cliente');
  }

  // 1. OBTENER EL PAQUETE Y EL USUARIO
  const pkg = await prisma.package.findUnique({
    where: { id: params.id },
    include: {
        user: { 
          // 🔥 IMPORTANTE: Traemos 'country' (que en la foto dice BB) y 'address'
          select: { name: true, address: true, cityZip: true, countryCode: true, country: true, phone: true } 
        },
        consolidatedShipment: {
            select: { serviceType: true }
        }
    }
  });

  if (!pkg || pkg.userId !== session.user.id) {
    return <div className="p-10 text-center font-bold text-red-500">Acceso Denegado</div>;
  }

  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { userId: session.user.id },
    orderBy: { isDefault: 'desc' },
    select: { id: true, brand: true, last4: true }
  });

  // 🔥 NUEVO: Traemos TODAS las direcciones de la libreta, ordenando la DEFAULT primero
  const userAddresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  // Definimos la dirección principal (La Default, o si no hay, nulo para usar el perfil viejo)
  const defaultAddress = userAddresses.length > 0 ? userAddresses[0] : null;

  // --- LÓGICA DE ALMACENAJE (Sin Cambios) ---
  const now = new Date();
  const created = new Date(pkg.createdAt);
  const paidUntil = pkg.storagePaidUntil ? new Date(pkg.storagePaidUntil) : null;
  const diffTimeTotal = Math.abs(now.getTime() - created.getTime());
  const daysInWarehouse = Math.ceil(diffTimeTotal / (1000 * 60 * 60 * 24));
  
  let storageDebt = 0;
  let overdueDays = 0;
  const isDelivered = ['ENTREGADO', 'DELIVERED', 'COMPLETADO', 'ENTREGADO_HISTORICO', 'CANCELADO'].includes(pkg.status);
  
  const length = Number(pkg.lengthIn) || 12; 
  const width = Number(pkg.widthIn) || 12;
  const height = Number(pkg.heightIn) || 10;
  const cubicFeet = (length * width * height) / 1728;
  const monthlyCost = STORAGE_RATE_PER_CFT * cubicFeet;
  const dailyRate = monthlyCost / 30;

  if (!isDelivered) {
      if (paidUntil) {
          const diffSincePaid = now.getTime() - paidUntil.getTime();
          const daysSincePaid = Math.floor(diffSincePaid / (1000 * 60 * 60 * 24));
          if (daysSincePaid > 0) {
              overdueDays = daysSincePaid;
              storageDebt = overdueDays * dailyRate;
          }
      } else {
          if (daysInWarehouse > STORAGE_FREE_DAYS) {
              overdueDays = daysInWarehouse - STORAGE_FREE_DAYS;
              storageDebt = overdueDays * dailyRate;
          }
      }
  }

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
  // 📸 PANTALLA DE PAQUETE ENTREGADO (Con Fotos y Firma)
  // =================================================================================
  if (isDelivered) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 font-montserrat flex flex-col items-center">

        <div className="max-w-md w-full space-y-6">
          {/* Banner Principal */}
          <div className="bg-green-600 rounded-2xl p-8 text-center shadow-lg text-white">
              <CheckCircle size={64} className="mx-auto mb-4 text-green-200" />
              <h1 className="text-2xl font-bold uppercase tracking-wide italic">{t('deliveredTitle') || '¡Paquete Entregado!'}</h1>
              <p className="font-mono text-sm text-green-100 mt-2 bg-green-800/50 inline-block px-4 py-1.5 rounded-full">{pkg.gmcTrackingNumber}</p>
          </div>

          {/* Tarjeta de Evidencia */}
          {(pkg.deliveryPhotoUrl || pkg.deliverySignature || pkg.photoUrlMiami) && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-5 flex items-center gap-2 border-b border-gray-100 pb-3">
                      <Box size={18} className="text-gmc-dorado-principal"/> Prueba de Entrega
                  </h2>
                  
                  <div className="space-y-6">
                      
                      {/* Foto del Pickup o Almacén en Miami */}
                      {pkg.photoUrlMiami && (
                          <div>
                              <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                                  <Camera size={14}/> Foto en Almacén / Pickup
                              </h3>
                              <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shadow-inner">
                                  <Image src={pkg.photoUrlMiami} alt="Foto Almacén" fill className="object-contain" />
                              </div>
                          </div>
                      )}

                      {/* Foto tomada por el chofer al entregar */}
                      {pkg.deliveryPhotoUrl && (
                          <div className="pt-2">
                              <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                                  <Camera size={14}/> Evidencia de Entrega
                              </h3>
                              <div className="relative w-full h-56 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shadow-sm">
                                  <Image src={pkg.deliveryPhotoUrl} alt="Foto de entrega" fill className="object-cover" />
                              </div>
                          </div>
                      )}

                      {/* Firma del Cliente */}
                      {pkg.deliverySignature && (
                          <div className="pt-2">
                              <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                                  <PenTool size={14}/> Firma de Recibido
                              </h3>
                              <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-4 flex justify-center items-center h-32 shadow-inner">
                                  {/* Usamos etiqueta img normal para base64 para evitar errores de Next.js */}
                                  <img src={pkg.deliverySignature} alt="Firma del cliente" className="max-h-full object-contain" />
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          )}
        </div>
      </div>
    );
  }

  // =================================================================================
  // ⚡️ LÓGICA DE NEGOCIO PROFESIONAL (COTIZACIÓN)
  // =================================================================================
  
  const isPickup = pkg.gmcTrackingNumber?.startsWith('GMC') || pkg.description?.toLowerCase().includes('pickup');
  const serviceType = pkg.consolidatedShipment?.serviceType; 
  const isRealConsolidation = serviceType === 'CONSOLIDATION' || pkg.description?.toLowerCase().includes('consolid');
  const handlingFee = (isPickup || !isRealConsolidation) ? 0 : INTERNATIONAL_HANDLING_FEE;
  
  // 🕵️‍♂️ LÓGICA DE DIRECCIÓN "VERDADERA"
  // Prioridad 1: defaultAddress. Prioridad 2: Perfil viejo.
  const dbCountryColumn = (defaultAddress?.country || pkg.user?.country || '').toUpperCase(); 
  const dbAddress = (defaultAddress?.address || pkg.user?.address || '').toUpperCase();       
  const dbCityZip = (defaultAddress?.cityZip || pkg.user?.cityZip || '').toUpperCase();       
  
  // Juntamos todo para buscar palabras clave
  const fullSearchString = `${dbAddress} ${dbCityZip} ${dbCountryColumn}`;

  let finalCountryCode = 'US'; // Fallback seguro
  let finalCountryName = 'United States';

  // 1. REGLA ESTADOS UNIDOS (Para arreglar Joliet, IL)
  const isUS = fullSearchString.includes(' IL ') || fullSearchString.includes('ILLINOIS') ||
               fullSearchString.includes(' FL ') || fullSearchString.includes('FLORIDA') ||
               fullSearchString.includes(' NY ') || fullSearchString.includes('NEW YORK') ||
               fullSearchString.includes(' TX ') || fullSearchString.includes('TEXAS') ||
               dbCountryColumn === 'US';

  // 2. REGLA CARIBE (Gasp Maker Cargo)
  // Prioridad: Si la columna 'country' dice BB, o la dirección dice BARBADOS -> Es Barbados.
  
  if (fullSearchString.includes('GRENADA') || dbCountryColumn === 'GD') {
      finalCountryCode = 'GD';
      finalCountryName = 'Grenada';
  }
  else if (fullSearchString.includes('BARBADOS') || dbCountryColumn === 'BB') {
      finalCountryCode = 'BB';
      finalCountryName = 'Barbados';
  }
  else if (fullSearchString.includes('TRINIDAD') || dbCountryColumn === 'TT') {
      finalCountryCode = 'TT';
      finalCountryName = 'Trinidad and Tobago';
  }
  else if (fullSearchString.includes('JAMAICA') || dbCountryColumn === 'JM') {
      finalCountryCode = 'JM';
      finalCountryName = 'Jamaica';
  }
  else if (fullSearchString.includes('CUBA') || dbCountryColumn === 'CU') {
      finalCountryCode = 'CU';
      finalCountryName = 'Cuba';
  }
  else if (fullSearchString.includes('THOMAS') || fullSearchString.includes('VIRGIN') || dbCountryColumn === 'VI') {
      finalCountryCode = 'VI';
      finalCountryName = 'US Virgin Islands';
  }
  else if (isUS) {
      finalCountryCode = 'US';
      finalCountryName = 'United States';
  } else {
      // Si todo falla, usamos el countryCode, pero solo si no es el MX conflictivo
      // Si dice MX pero no detectamos nada de México en la dirección, asumimos US por seguridad
      const rawCode = defaultAddress?.country || pkg.user?.countryCode || 'US';
      if (rawCode === 'mx' || rawCode === 'MX') {
          finalCountryCode = 'US'; // Evitamos el error de México
      } else {
          finalCountryCode = rawCode;
          finalCountryName = pkg.user?.country || 'United States';
      }
  }

  const normalizedPkg = {
      ...pkg,
      carrierTrackingNumber: pkg.carrierTrackingNumber || pkg.gmcTrackingNumber || 'S/N',
      courier: pkg.courier || (isPickup ? 'Gasp Maker Cargo' : 'Courier Desconocido'),
      description: pkg.description || (isPickup ? 'Pickup en Bodega' : 'Paquete sin descripción'),
      handlingFee: handlingFee 
  };

  // 🔥 DATOS LIMPIOS PARA LA API
  // Priorizamos los datos de la nueva tabla "Address" (si existe). Si no existe, usamos los del perfil original.
  const userProfile = {
      // 1. Usa el "fullName" de la nueva libreta de direcciones (Ej. Jason Bosland). Si no, usa el del perfil.
      name: defaultAddress?.fullName || pkg.user?.name || session.user.name || '',
      
      // 2. Prioriza los datos de la nueva libreta
      address: defaultAddress?.address || pkg.user?.address || '', 
      
      city: defaultAddress?.cityZip || pkg.user?.cityZip || '',    
      zip: defaultAddress?.cityZip || pkg.user?.cityZip || '',     
      cityZip: defaultAddress?.cityZip || pkg.user?.cityZip || '',

      // 3. Prioriza el país de la libreta, o usa el fallback calculado arriba
      country: defaultAddress?.country || finalCountryCode, 
      countryCode: defaultAddress?.country || finalCountryCode,
      countryName: finalCountryName,
      
      phone: defaultAddress?.phone || pkg.user?.phone || ''
  };

  return (
    <PackageDetailClient 
      pkg={normalizedPkg} 
      userProfile={userProfile} 
      savedCards={paymentMethods} 
      // 🔥 Le pasamos todas las direcciones al cliente para crear el menú desplegable en el siguiente paso
      allAddresses={userAddresses} 
    />
  );
}