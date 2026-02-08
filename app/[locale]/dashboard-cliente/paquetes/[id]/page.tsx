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

  if (isDelivered) {
    return (
      <div className="min-h-screen bg-white p-4 sm:p-6 font-montserrat flex justify-center">
        <div className="max-w-xl w-full space-y-6 mt-6">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center shadow-sm">
              <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-green-100">
                  <CheckCircle size={32} className="text-green-600" />
              </div>
              <h1 className="text-2xl font-bold uppercase tracking-wide text-green-800">{t('deliveredTitle')}</h1>
              <p className="font-mono text-lg text-green-700 mt-1">{pkg.gmcTrackingNumber}</p>
          </div>
          {/* ... resto del código de entregados ... */}
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
  // Aquí ignoramos el 'countryCode' (que dice MX) y usamos 'country' (que dice BB/TT) y la dirección.
  
  const dbCountryColumn = (pkg.user?.country || '').toUpperCase(); // En tu foto df3.jpg esto es "BB"
  const dbAddress = (pkg.user?.address || '').toUpperCase();       // "S Ramp"
  const dbCityZip = (pkg.user?.cityZip || '').toUpperCase();       // "Christ Church..."
  
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
      const rawCode = pkg.user?.countryCode || 'US';
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
  // Aquí pasamos los datos que extrajimos de la dirección y la columna correcta ('country').
  const userProfile = {
      name: pkg.user?.name || session.user.name || '',
      address: pkg.user?.address || '', // "S Ramp"
      
      city: pkg.user?.cityZip || '',    // "Christ Church..."
      zip: pkg.user?.cityZip || '',     // "Christ Church..."
      cityZip: pkg.user?.cityZip || '',

      // ENVIAMOS EL CÓDIGO CALCULADO (BB, GD, TT), ignorando el 'mx'
      country: finalCountryCode, 
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