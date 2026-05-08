import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { redirect } from 'next/navigation';
import PackageDetailClient from '@/components/PackageDetailClient';
import StorageLockScreen from '@/components/client/StorageLockScreen';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, CheckCircle, Calendar, User, Camera, PenTool, Box, Truck } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
// ✅ IMPORTACIÓN AGREGADA
import InteractiveEvidence from '@/components/client/InteractiveEvidence';

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
          select: { name: true, address: true, cityZip: true, countryCode: true, country: true, phone: true, referredBy: true, referralRewardPaid: true, walletBalance: true } 
        },
        consolidatedShipment: {
            select: { serviceType: true }
        }
    }
  });

  if (!pkg || pkg.userId !== session.user.id) {
    return <div className="p-10 text-center font-bold text-red-500">Acceso Denegado</div>;
  }

  const rawPaymentMethods = await prisma.paymentMethod.findMany({
    where: { userId: session.user.id },
    orderBy: { isDefault: 'desc' },
    select: { id: true, brand: true, last4: true, stripePaymentMethodId: true }
  });

  const paymentMethods = await Promise.all(
    rawPaymentMethods.map(async (card) => {
      try {
        if (!card.stripePaymentMethodId) {
          return { id: card.id, brand: card.brand, last4: card.last4, country: null };
        }
        const stripePm = await stripe.paymentMethods.retrieve(card.stripePaymentMethodId);
        return {
          id: card.id,
          brand: card.brand,
          last4: card.last4,
          country: stripePm.card?.country || null
        };
      } catch (error) {
        return { id: card.id, brand: card.brand, last4: card.last4, country: null };
      }
    })
  );

  const userAddresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  const defaultAddress = userAddresses.length > 0 ? userAddresses[0] : null;

  // --- LÓGICA DE ALMACENAJE ---
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
  // 📸 PANTALLA DE PAQUETE ENTREGADO
  // =================================================================================
  if (isDelivered) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 font-montserrat flex flex-col items-center">
        <div className="max-w-md w-full space-y-6">
          <div className="bg-green-600 rounded-2xl p-8 text-center shadow-lg text-white">
              <CheckCircle size={64} className="mx-auto mb-4 text-green-200" />
              <h1 className="text-2xl font-bold uppercase tracking-wide italic">{t('deliveredTitle') || '¡Paquete Entregado!'}</h1>
              <p className="font-mono text-sm text-green-100 mt-2 bg-green-800/50 inline-block px-4 py-1.5 rounded-full">{pkg.gmcTrackingNumber}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-5 flex items-center gap-2 border-b border-gray-100 pb-3">
                  <Box size={18} className="text-gmc-dorado-principal"/> Prueba de Entrega
              </h2>
              
              <div className="space-y-6">
                  {/* Foto Almacén Interactiva */}
                  {pkg.photoUrlMiami && (
                      <div>
                          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                              <Camera size={14}/> Foto en Almacén / Pickup
                          </h3>
                          <InteractiveEvidence 
                              photoUrl={pkg.photoUrlMiami} 
                              trackingNumber={pkg.carrierTrackingNumber || pkg.gmcTrackingNumber} 
                          />
                      </div>
                  )}

                  {/* Foto Chofer Interactiva */}
                  {pkg.deliveryPhotoUrl && (
                      <div className="pt-2">
                          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                              <Camera size={14}/> Evidencia de Entrega
                          </h3>
                          <InteractiveEvidence 
                              photoUrl={pkg.deliveryPhotoUrl} 
                              trackingNumber={pkg.carrierTrackingNumber || pkg.gmcTrackingNumber} 
                          />
                      </div>
                  )}

                  {pkg.deliverySignature && (
                      <div className="pt-2">
                          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                              <PenTool size={14}/> Firma de Recibido
                          </h3>
                          <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-4 flex justify-center items-center h-32 shadow-inner">
                              <img src={pkg.deliverySignature} alt="Firma del cliente" className="max-h-full object-contain" />
                          </div>
                      </div>
                  )}
              </div>
          </div>
        </div>
      </div>
    );
  }

  // --- LÓGICA DE NEGOCIO ---
  const isPickup = pkg.gmcTrackingNumber?.startsWith('GMC') || pkg.description?.toLowerCase().includes('pickup');
  const serviceType = pkg.consolidatedShipment?.serviceType; 
  const isRealConsolidation = serviceType === 'CONSOLIDATION' || pkg.description?.toLowerCase().includes('consolid');
  const handlingFee = (isPickup || !isRealConsolidation) ? 0 : INTERNATIONAL_HANDLING_FEE;
  
  const dbCountryColumn = (defaultAddress?.country || pkg.user?.country || '').toUpperCase(); 
  const dbAddress = (defaultAddress?.address || pkg.user?.address || '').toUpperCase();       
  const dbCityZip = (defaultAddress?.cityZip || pkg.user?.cityZip || '').toUpperCase();       
  const fullSearchString = `${dbAddress} ${dbCityZip} ${dbCountryColumn}`;

  let finalCountryCode = 'US'; 
  let finalCountryName = 'United States';

  const isUS = fullSearchString.includes(' IL ') || fullSearchString.includes('ILLINOIS') ||
               fullSearchString.includes(' FL ') || fullSearchString.includes('FLORIDA') ||
               fullSearchString.includes(' NY ') || fullSearchString.includes('NEW YORK') ||
               fullSearchString.includes(' TX ') || fullSearchString.includes('TEXAS') ||
               dbCountryColumn === 'US';

  if (fullSearchString.includes('GRENADA') || dbCountryColumn === 'GD') {
      finalCountryCode = 'GD'; finalCountryName = 'Grenada';
  } else if (fullSearchString.includes('BARBADOS') || dbCountryColumn === 'BB') {
      finalCountryCode = 'BB'; finalCountryName = 'Barbados';
  } else if (fullSearchString.includes('TRINIDAD') || dbCountryColumn === 'TT') {
      finalCountryCode = 'TT'; finalCountryName = 'Trinidad and Tobago';
  } else if (fullSearchString.includes('JAMAICA') || dbCountryColumn === 'JM') {
      finalCountryCode = 'JM'; finalCountryName = 'Jamaica';
  } else if (fullSearchString.includes('CUBA') || dbCountryColumn === 'CU') {
      finalCountryCode = 'CU'; finalCountryName = 'Cuba';
  } else if (fullSearchString.includes('THOMAS') || fullSearchString.includes('VIRGIN') || dbCountryColumn === 'VI') {
      finalCountryCode = 'VI'; finalCountryName = 'US Virgin Islands';
  } else if (isUS) {
      finalCountryCode = 'US'; finalCountryName = 'United States';
  } else {
      const rawCode = defaultAddress?.country || pkg.user?.countryCode || 'US';
      if (rawCode === 'mx' || rawCode === 'MX') { finalCountryCode = 'US'; } 
      else { finalCountryCode = rawCode; finalCountryName = pkg.user?.country || 'United States'; }
  }

  const normalizedPkg = {
      ...pkg,
      carrierTrackingNumber: pkg.carrierTrackingNumber || pkg.gmcTrackingNumber || 'S/N',
      courier: pkg.courier || (isPickup ? 'Gasp Maker Cargo' : 'Courier Desconocido'),
      description: pkg.description || (isPickup ? 'Pickup en Bodega' : 'Paquete sin descripción'),
      handlingFee: handlingFee 
  };

  const userProfile = {
      name: defaultAddress?.fullName || pkg.user?.name || session.user.name || '',
      address: defaultAddress?.address || pkg.user?.address || '', 
      city: defaultAddress?.cityZip || pkg.user?.cityZip || '',    
      zip: defaultAddress?.cityZip || pkg.user?.cityZip || '',     
      cityZip: defaultAddress?.cityZip || pkg.user?.cityZip || '',
      country: defaultAddress?.country || finalCountryCode, 
      countryCode: defaultAddress?.country || finalCountryCode,
      countryName: finalCountryName,
      phone: defaultAddress?.phone || pkg.user?.phone || '',
      referredBy: pkg.user?.referredBy || null,
      referralRewardPaid: pkg.user?.referralRewardPaid || false,
      walletBalance: pkg.user?.walletBalance || 0,
  };

  return (
    <PackageDetailClient 
      pkg={normalizedPkg} 
      userProfile={userProfile} 
      savedCards={paymentMethods} 
      allAddresses={userAddresses} 
    />
  );
}