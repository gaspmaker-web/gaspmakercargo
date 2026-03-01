import React from 'react';
import { Package, CheckCircle, MapPin, Plane, Calendar, Box, Info, ArrowRight, XCircle, Home } from 'lucide-react';
import prisma from '@/lib/prisma'; 
// 🔥 Importamos getTranslations para Server Components
import { getTranslations } from 'next-intl/server';

export default async function RastreoPage({ params }: { params: { trackingNumber: string, locale: string } }) {
  const trackingNumber = params.trackingNumber;
  // 🔥 Inicializamos traducciones en el servidor
  const t = await getTranslations('TrackingDetails');

  // 1️⃣ BUSCAMOS SI ES UN PAQUETE INDIVIDUAL (Incluyendo al Usuario para saber el país)
  let itemData: any = await prisma.package.findUnique({
    where: { gmcTrackingNumber: trackingNumber },
    include: { user: true }
  });
  
  let isConsolidated = false;
  let piecesCount = 1;

  // 2️⃣ SI NO ES PAQUETE, BUSCAMOS SI ES UNA CONSOLIDACIÓN
  if (!itemData) {
    itemData = await prisma.consolidatedShipment.findUnique({
      where: { gmcShipmentNumber: trackingNumber },
      include: { packages: true, user: true } // Traemos paquetes y usuario
    });
    if (itemData) {
      isConsolidated = true;
      piecesCount = itemData.packages?.length || 0;
    }
  }

  // ❌ 3️⃣ SI NO EXISTE (404 Elegante)
  if (!itemData) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center mt-20 font-montserrat">
        <XCircle size={60} className="text-red-400 mx-auto mb-4" />
        <h1 className="text-2xl font-black text-gray-800 uppercase">{t('notFoundTitle')}</h1>
        <p className="text-gray-500 mt-2">
            {t('notFoundDesc', { tracking: trackingNumber })}
        </p>
      </div>
    );
  }

  // 🧮 4️⃣ CÁLCULOS LOGÍSTICOS
  const status = itemData.status?.toUpperCase() || 'PENDIENTE';
  
  // Cálculo de Volumen (L x W x H / 1728 = ft³)
  let volume = 0;
  if (itemData.lengthIn && itemData.widthIn && itemData.heightIn) {
      volume = (itemData.lengthIn * itemData.widthIn * itemData.heightIn) / 1728;
  }

  // 🌍 PAÍS DE DESTINO (BÚSQUEDA INTELIGENTE)
  // El sistema intentará buscar el destino en este orden de prioridad:
  const destination = 
    itemData.destinationCountryCode || // 1. Si es consolidado, busca el código de destino
    itemData.user?.country ||          // 2. Si no, busca el país en el perfil del cliente
    itemData.user?.countryCode ||      // 3. Si no, busca las siglas del país (ej. VE, US, MX)
    itemData.user?.cityZip ||          // 4. Si el país está vacío, muestra la Ciudad/Zip
    t('defaultDestination');           // 5. Fallback final si la base de datos está totalmente vacía

  // Mapeo del estado actual
  const getStatusDisplay = (st: string) => {
      if (st.includes('ENTREGADO')) return { title: t('statusDelivered'), color: 'bg-green-600', text: 'text-green-700', bgL: 'bg-green-100', icon: <Home size={36} /> };
      if (st.includes('DESTINO') || st.includes('ADUANA')) return { title: t('statusDestination'), color: 'bg-blue-600', text: 'text-blue-700', bgL: 'bg-blue-100', icon: <MapPin size={36} /> };
      if (st.includes('TRANSITO')) return { title: t('statusTransit'), color: 'bg-blue-600', text: 'text-blue-700', bgL: 'bg-blue-100', icon: <Plane size={36} /> };
      return { title: t('statusProcessing'), color: 'bg-gray-800', text: 'text-gray-700', bgL: 'bg-gray-200', icon: <Package size={36} /> };
  };
  const uiStatus = getStatusDisplay(status);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto font-montserrat animate-in fade-in duration-500">
      
      {/* ================= CABECERA CENTRADA ================= */}
      <div className="relative flex flex-col items-center justify-center mb-8 pt-2">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 uppercase tracking-widest text-center mb-4">
            {isConsolidated ? t('titleConsolidated') : t('titlePackage')}
        </h1>
        <p className="text-sm text-gray-500 flex items-center gap-2">
            {t('trackingLabel')} 
            <span className="font-mono bg-blue-50 text-blue-700 px-3 py-1 rounded-md font-bold border border-blue-100">
                {trackingNumber}
            </span>
        </p>
      </div>

      {/* ================= CONTENEDOR PRINCIPAL ================= */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden max-w-4xl mx-auto">
        
        {/* SECCIÓN 1: ESTADO ACTUAL (HERO) */}
        <div className="p-8 sm:p-10 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6 w-full md:w-auto">
                <div className={`w-20 h-20 ${uiStatus.color} text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0`}>
                    {uiStatus.icon}
                </div>
                <div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${uiStatus.bgL} ${uiStatus.text} uppercase tracking-wide mb-2`}>
                        {status !== 'ENTREGADO' && (
                            <span className="relative flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${uiStatus.color} opacity-75`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${uiStatus.color}`}></span>
                            </span>
                        )}
                        {status.replace(/_/g, ' ')}
                    </span>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                        {uiStatus.title}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                        <Calendar size={14} /> {t('updatedAt')} {itemData.updatedAt ? new Date(itemData.updatedAt).toLocaleDateString() : t('today')}
                    </p>
                </div>
            </div>
        </div>

        {/* SECCIÓN 2: DETALLES DEL PAQUETE (GRID) */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-b border-gray-100">
            {/* Origen y Destino */}
            <div className="p-8 md:border-r border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <MapPin size={14} /> {t('routeTitle')}
                </h3>
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="text-center truncate w-1/3">
                        <p className="text-xs text-gray-500 font-medium">{t('origin')}</p>
                        <p className="font-bold text-gray-900 truncate" title="Miami, FL">Miami, FL</p>
                    </div>
                    <ArrowRight size={20} className="text-gray-300 w-1/3 text-center" />
                    <div className="text-center truncate w-1/3">
                        <p className="text-xs text-gray-500 font-medium">{t('destination')}</p>
                        <p className="font-bold text-gray-900 truncate capitalize" title={destination}>{destination}</p>
                    </div>
                </div>
            </div>

            {/* Info del Paquete */}
            <div className="p-8">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Info size={14} /> {t('specsTitle')}
                </h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 flex items-center gap-2"><Box size={16}/> {t('volume')}</span>
                        <span className="font-semibold text-gray-900">{volume > 0 ? volume.toFixed(2) : '--'} ft³</span>
                    </div>
                    <div className="w-full h-px bg-gray-100"></div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 flex items-center gap-2"><Package size={16}/> {t('pieces')}</span>
                        <span className="font-semibold text-gray-900">{piecesCount}</span>
                    </div>
                    <div className="w-full h-px bg-gray-100"></div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 flex items-center gap-2">⚖️ {t('weight')}</span>
                        <span className="font-semibold text-gray-900">{itemData.weightLbs ? `${itemData.weightLbs} lbs` : '--'}</span>
                    </div>
                </div>
            </div>
        </div>
        
        {/* SECCIÓN 3: TIMELINE DE RASTREO */}
        <div className="p-8 sm:p-10">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">
                {t('historyTitle')}
            </h3>

            <div className="relative border-l-2 border-gray-100 ml-6 space-y-8">
                
                {/* ESTADO ACTUAL (Destacado) */}
                <div className="relative pl-8">
                    <div className={`absolute -left-[20px] bg-white p-2 rounded-full border-2 ${uiStatus.color.replace('bg-', 'border-')} ${uiStatus.text} shadow-sm`}>
                        {uiStatus.icon}
                    </div>
                    <div className={`${uiStatus.bgL} border ${uiStatus.color.replace('bg-', 'border-').replace('600', '200')} p-4 rounded-xl`}>
                        <p className={`text-sm font-black ${uiStatus.text}`}>{t('currentStatus')} {status.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-gray-600 mt-1 opacity-80">{t('lastUpdate')}</p>
                    </div>
                </div>

                {/* HISTORIAL: Procesado en Miami */}
                {status !== 'PENDIENTE' && (
                    <div className="relative pl-8 opacity-70">
                        <div className="absolute -left-[18px] bg-white p-1 rounded-full border-2 border-gray-200">
                            <CheckCircle size={24} className="text-gray-400" strokeWidth={1.5} />
                        </div>
                        <p className="text-sm font-bold text-gray-800">{t('processedTitle')}</p>
                        <p className="text-xs text-gray-500 mt-1">{t('processedDesc')}</p>
                    </div>
                )}

                {/* HISTORIAL: Recibido */}
                <div className="relative pl-8 opacity-70">
                    <div className="absolute -left-[18px] bg-white p-1 rounded-full border-2 border-gray-200">
                        <CheckCircle size={24} className="text-gray-400" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-bold text-gray-800">{t('receivedTitle')}</p>
                    <p className="text-xs text-gray-500 mt-1">{t('receivedDesc')}</p>
                </div>

            </div>
        </div>
      </div>

    </div>
  );
}