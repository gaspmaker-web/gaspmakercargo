"use client";

import React, { useState } from 'react';
import { Search, MapPin, Calendar, Plane, ExternalLink, Box, Copy, Truck, Scale, ArrowRight, Check } from 'lucide-react';
// 🔥 1. Importamos el hook
import { useTranslations } from 'next-intl';
// 🔥 2. Importamos la función de tracking (NUEVO)
import { getTrackingUrl } from '@/lib/getTrackingUrl';

interface Props {
  packages: any[];
  userCountryCode: string;
}

export default function InTransitPackagesCarousel({ packages, userCountryCode }: Props) {
  // 🔥 3. Inicializamos traducciones
  const t = useTranslations('PackageDetail'); 
  const tPage = useTranslations('InTransitPage');

  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Lógica de Filtrado
  const filteredPackages = packages.filter(pkg => {
    const parent = pkg.consolidatedShipment;
    const term = searchTerm.toLowerCase();
    return (
        pkg.description?.toLowerCase().includes(term) ||
        pkg.gmcTrackingNumber?.toLowerCase().includes(term) ||
        pkg.carrierTrackingNumber?.toLowerCase().includes(term) ||
        parent?.finalTrackingNumber?.toLowerCase().includes(term)
    );
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      {/* 🔍 BUSCADOR PREMIUM */}
      <div className="relative max-w-lg mx-auto md:mx-0 group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
        </div>
        <input 
            type="text" 
            placeholder={t('searchPlaceholder') || "Search shipment..."} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-full border border-gray-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all shadow-sm hover:shadow-md text-gray-700 font-medium placeholder:font-normal"
        />
      </div>

      {/* 🎠 CARRUSEL DE TARJETAS */}
      {filteredPackages.length > 0 ? (
        <div className="flex overflow-x-auto pb-12 -mx-4 px-4 gap-6 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent pt-2">
            {filteredPackages.map((pkg) => {
                // Datos Calculados
                const parent = pkg.consolidatedShipment;
                const hasMasterTracking = !!parent?.finalTrackingNumber;
                
                const displayTracking = hasMasterTracking 
                    ? parent.finalTrackingNumber 
                    : (pkg.gmcTrackingNumber || t('processing'));

                const displayCourier = hasMasterTracking 
                    ? (parent.selectedCourier || 'Gasp Maker Cargo') 
                    : (pkg.selectedCourier || 'Gasp Maker Cargo');
                
                const isGMC = displayCourier.toUpperCase().includes('GASP') || displayCourier.toUpperCase().includes('MAKER');

                // 🔥 GENERAMOS LA URL DE RASTREO
                const trackingUrl = getTrackingUrl(
                    hasMasterTracking ? parent.selectedCourier : pkg.selectedCourier,
                    displayTracking
                );

                return (
                    <div 
                        key={pkg.id} 
                        className="min-w-[350px] max-w-[350px] bg-white rounded-[2rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border border-gray-100 snap-center transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(59,130,246,0.15)] flex flex-col relative overflow-hidden group"
                    >
                        {/* Cabecera Tipo Ticket */}
                        <div className="bg-slate-50/80 backdrop-blur-md p-5 border-b border-gray-100 flex justify-between items-center">
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-blue-200">
                                <Plane size={12} className="animate-pulse"/> {pkg.status === 'EN_TRANSITO' ? 'ON FLIGHT' : pkg.status.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs text-gray-400 font-mono font-medium flex items-center gap-1">
                                <Calendar size={12}/>
                                {new Date(pkg.updatedAt || pkg.createdAt).toLocaleDateString()}
                            </span>
                        </div>

                        {/* Cuerpo de la Tarjeta */}
                        <div className="p-6 flex-1 flex flex-col gap-5">
                            
                            {/* Ruta Visual (Timeline) */}
                            <div className="flex items-center justify-between text-xs text-gray-500 font-bold uppercase tracking-wide">
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                    MIA
                                </div>
                                <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-2 relative top-[1px]">
                                    <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 bg-white px-1">
                                        <Plane size={12} className="text-blue-400 rotate-90" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-blue-600">
                                    {userCountryCode}
                                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                                </div>
                            </div>

                            {/* Información Principal */}
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg line-clamp-1 mb-1 capitalize">
                                    {pkg.description || t('noDescription')}
                                </h3>
                                <div className="flex items-center gap-2">
                                    {hasMasterTracking && (
                                        <span title="Consolidado" className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded text-[10px] font-bold border border-purple-100 flex items-center gap-1">
                                            <Box size={10}/> CONSOLIDATED
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-400 font-medium">
                                        {displayCourier}
                                    </span>
                                </div>
                            </div>

                            {/* Tracking Number con Copia */}
                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 group-hover:border-blue-200 transition-colors relative">
                                <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest mb-1">
                                    {t('tracking')}
                                </p>
                                <div className="flex justify-between items-center">
                                    {/* 🔥 Lógica: Si es GMC es texto, si es externo es Link */}
                                    {isGMC ? (
                                        <p className="font-mono text-base font-bold text-slate-800 truncate tracking-tight">
                                            {displayTracking}
                                        </p>
                                    ) : (
                                        <a 
                                            href={trackingUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-mono text-base font-bold text-slate-800 truncate tracking-tight hover:text-blue-600 hover:underline cursor-pointer"
                                        >
                                            {displayTracking}
                                        </a>
                                    )}

                                    <button 
                                        onClick={() => handleCopy(displayTracking, pkg.id)}
                                        className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                                        title="Copy"
                                    >
                                        {copiedId === pkg.id ? <Check size={16} className="text-green-500"/> : <Copy size={16}/>}
                                    </button>
                                </div>
                            </div>

                            {/* Footer: Peso y Botón */}
                            <div className="flex items-end justify-between gap-4 mt-auto">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">{t('weight')}</p>
                                    <div className="flex items-baseline gap-1">
                                        <Scale size={14} className="text-gray-400" />
                                        <span className="text-xl font-bold text-slate-800">{pkg.weightLbs}</span>
                                        <span className="text-xs font-bold text-gray-400">lb</span>
                                    </div>
                                </div>

                                {/* 🔥 BOTÓN INTELIGENTE: LINK SI ES EXTERNO, DISABLED SI ES INTERNO */}
                                {isGMC ? (
                                    <button
                                        type="button"
                                        disabled={true}
                                        className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all shadow-none opacity-50 cursor-not-allowed select-none bg-slate-800"
                                    >
                                        {t('internalRoute') || "Internal Route"} <Box size={14}/>
                                    </button>
                                ) : (
                                    <a
                                        href={trackingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg bg-blue-600 hover:bg-blue-700 active:scale-95"
                                    >
                                        {t('trackBtn') || "Track"} <ExternalLink size={14}/>
                                    </a>
                                )}
                            </div>

                        </div>
                    </div>
                );
            })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200 mx-auto max-w-2xl">
            <div className="mx-auto w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-5 animate-bounce">
                <Plane size={36} className="text-blue-400"/>
            </div>
            <h3 className="text-xl font-bold text-gray-900">{t('noActiveShipments') || "No active shipments"}</h3>
            <p className="text-gray-500 text-sm mt-2 px-6">
                {t('noTransitMsg') || "You don't have any packages in transit right now."} <br/>
                {t('transitAppearMsg') || "Your shipments will appear here when they leave Miami."}
            </p>
        </div>
      )}
    </div>
  );
}