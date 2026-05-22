'use client';

import React, { useState } from 'react';
import { Search, MapPin, Calendar, Package, ExternalLink, Box, Copy, CheckCircle, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface Props {
  consolidations: any[];
  loosePackages: any[];
  userCountryCode: string;
}

export default function DeliveredPackagesCarousel({ consolidations, loosePackages, userCountryCode }: Props) {
  const t = useTranslations('PackageDetail');
  const tDelivered = useTranslations('DeliveredPage');
  const tEnDestino = useTranslations('DeliveredPage'); 

  const params = useParams();
  const locale = params?.locale || 'es'; 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // 🔥 ESTADO GLOBAL DEL ACORDEÓN
  const [expandedMasterId, setExpandedMasterId] = useState<string | null>(null);

  // Filtramos Consolidaciones
  const filteredConsolidations = consolidations?.filter(cons => 
    cons.gmcShipmentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cons.packages?.some((pkg: any) => 
      pkg.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.gmcTrackingNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  // Filtramos Paquetes Sueltos
  const filteredLoose = loosePackages?.filter(pkg => 
    pkg.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.gmcTrackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.carrierTrackingNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const hasResults = filteredConsolidations.length > 0 || filteredLoose.length > 0;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getDestinationCode = (address?: string) => {
    if (!address) return userCountryCode;
    const matchBeforeTel = address.match(/([A-Z]{2})\s*\|\s*Tel:/i);
    if (matchBeforeTel && matchBeforeTel[1]) return matchBeforeTel[1].toUpperCase();
    const matchEnd = address.match(/,\s*([A-Z]{2})\s*(?:\||$)/);
    if (matchEnd && matchEnd[1]) return matchEnd[1].toUpperCase();
    return userCountryCode; 
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 font-montserrat">
      
      {/* 🔍 BARRA DE BÚSQUEDA FLOTANTE */}
      <div className="relative max-w-md mx-auto md:mx-0">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="text-gray-400" size={18} />
        </div>
        <input 
            type="text" 
            placeholder={t('searchPlaceholder') || "Search..."} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 bg-white focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none transition-all shadow-sm hover:shadow-md"
        />
      </div>

      {/* 🎠 CARRUSEL PREMIUM */}
      {hasResults ? (
        <div className="flex overflow-x-auto pb-10 -mx-4 px-4 gap-6 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent pt-2 items-stretch">
            
            {/* ============================================================== */}
            {/* 📦 1. RENDERIZAR CONSOLIDACIONES MÁSTER */}
            {/* ============================================================== */}
            {filteredConsolidations.map((shipment) => {
                const realDestination = getDestinationCode(shipment.shippingAddress);
                const packageCount = shipment.packages?.length || 0;
                
                const isExpanded = expandedMasterId === shipment.id;

                return (
                    <div 
                        key={shipment.id} 
                        className="min-w-[340px] max-w-[340px] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6 snap-center transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] flex flex-col justify-between relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-50 to-transparent rounded-bl-full -mr-4 -mt-4 opacity-50"></div>

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <span className="bg-green-100/80 backdrop-blur-sm text-green-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-green-200">
                                    <CheckCircleIcon size={12}/> {tDelivered.has('statusDelivered') ? tDelivered('statusDelivered') : "Delivered"}
                                </span>
                                <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                                    <Calendar size={12}/>
                                    {new Date(shipment.updatedAt || shipment.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="mb-4">
                                {/* 🔥 FRASE "CONSOLIDADO" MULTILINGÜE */}
                                <h3 className="font-bold text-gray-800 text-xl line-clamp-1 mb-1 tracking-tight flex items-center gap-2">
                                    <Layers className="text-purple-500" size={20}/> 
                                    {tDelivered.has('consolidated') ? tDelivered('consolidated') : 'Consolidado'}
                                </h3>
                                <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                                    <div className="flex items-center gap-1.5">
                                      <MapPin size={14} className="text-gray-400"/>
                                      <span>{tDelivered.has('destination') ? tDelivered('destination') : "Destination"}: <strong className="text-gray-700">{realDestination}</strong></span>
                                    </div>
                                    <span className="text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded">
                                      {tEnDestino.has('containsPackages') ? tEnDestino('containsPackages', { count: packageCount }) : `${packageCount} packs`}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-purple-50/50 rounded-xl p-3 mb-3 border border-purple-100 group-hover:border-purple-300 transition-colors">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-[10px] text-purple-600 uppercase font-bold tracking-widest">TRACKING MASTER</p>
                                    <button onClick={() => handleCopy(shipment.gmcShipmentNumber, shipment.id)} className="text-purple-400 hover:text-purple-600">
                                        {copiedId === shipment.id ? <CheckCircle size={14} className="text-green-500"/> : <Copy size={14}/>}
                                    </button>
                                </div>
                                <div className="font-mono text-sm font-bold text-gray-900 truncate">
                                    {shipment.gmcShipmentNumber}
                                </div>
                            </div>

                            {/* 🔥 MENÚ ACORDEÓN VIEW PACKAGES / OCULTAR PAQUETES MULTILINGÜE */}
                            <div className="mt-2 mb-4 border-t border-gray-100 pt-3">
                                <button
                                    onClick={() => setExpandedMasterId(isExpanded ? null : shipment.id)}
                                    className="w-full flex items-center justify-center gap-2 text-blue-600 text-xs font-bold hover:text-blue-800 transition-colors py-2 uppercase"
                                >
                                    <Package size={14} />
                                    {isExpanded 
                                        ? (tDelivered.has('hidePackages') ? tDelivered('hidePackages') : 'OCULTAR PAQUETES')
                                        : `${tDelivered.has('viewPackages') ? tDelivered('viewPackages') : 'VIEW PACKAGES'} (${packageCount})`}
                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>

                                {isExpanded && (
                                    <div className="mt-3 space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 animate-in slide-in-from-top-2 fade-in duration-200 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
                                        {shipment.packages?.map((pkg: any) => (
                                            <div key={pkg.id} className="flex flex-col bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-xs font-bold text-gray-800 capitalize line-clamp-1">{pkg.description || 'Paquete'}</span>
                                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">{pkg.weightLbs ? `${pkg.weightLbs} lb` : ''}</span>
                                                </div>
                                                <span className="text-[10px] font-mono text-gray-500">{pkg.gmcTrackingNumber}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ZONA DE BOTONES */}
                            <div className="flex flex-col gap-2 mt-auto border-t border-gray-100 pt-3">
                                <Link 
                                    href={`/${locale}/dashboard-cliente/rastreo/${shipment.gmcShipmentNumber}`}
                                    className="w-full flex items-center justify-center gap-2 bg-gmc-dorado-principal hover:bg-yellow-600 text-white text-sm font-bold py-3 px-4 rounded-xl transition-all active:scale-[0.98] shadow-sm"
                                >
                                    📍 {tDelivered.has('trackPackage') ? tDelivered('trackPackage') : "Track Package"}
                                </Link>

                              {/* Enlace a Prueba de Entrega del Consolidado */}
<Link 
    href={`/${locale}/dashboard-cliente/paquetes/${shipment.packages?.[0]?.id}`}
    className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg shadow-gray-200 active:scale-[0.98]"
>
    <ExternalLink size={16}/> {tDelivered.has('viewProof') ? tDelivered('viewProof') : "View Proof"}
</Link>
                                {shipment.awbDocumentUrl && (
                                  <a 
                                    href={shipment.awbDocumentUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-100 hover:border-gray-200 text-gray-700 text-sm font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm uppercase tracking-wide"
                                  >
                                    📄 {tEnDestino.has('viewCustomsDoc') ? tEnDestino('viewCustomsDoc') : "Ver Documento Aduanal"}
                                  </a>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* ============================================================== */}
            {/* 📦 2. RENDERIZAR PAQUETES SUELTOS */}
            {/* ============================================================== */}
            {filteredLoose.map((pkg) => {
                const realDestination = getDestinationCode(pkg.shippingAddress);

                return (
                    <div 
                        key={pkg.id} 
                        className="min-w-[340px] max-w-[340px] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6 snap-center transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] flex flex-col justify-between relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-50 to-transparent rounded-bl-full -mr-4 -mt-4 opacity-50"></div>

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <span className="bg-green-100/80 backdrop-blur-sm text-green-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-green-200">
                                    <CheckCircleIcon size={12}/> {tDelivered.has('statusDelivered') ? tDelivered('statusDelivered') : "Delivered"}
                                </span>
                                <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                                    <Calendar size={12}/>
                                    {new Date(pkg.updatedAt || pkg.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="mb-5">
                                <h3 className="font-bold text-gray-800 text-xl line-clamp-1 mb-1 capitalize tracking-tight">
                                    {pkg.description || t('noDescription')}
                                </h3>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                    <MapPin size={14} className="text-gray-400"/>
                                    <span>{tDelivered.has('destination') ? tDelivered('destination') : "Destination"}: <strong className="text-gray-700">{realDestination}</strong></span>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-3 mb-5 border border-gray-200/60 group-hover:border-green-200 transition-colors">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{t('tracking')}</p>
                                    <button onClick={() => handleCopy(pkg.gmcTrackingNumber, pkg.id)} className="text-gray-400 hover:text-green-600">
                                        {copiedId === pkg.id ? <CheckCircle size={14} className="text-green-500"/> : <Copy size={14}/>}
                                    </button>
                                </div>
                                <div className="font-mono text-sm font-bold text-gray-800 truncate flex items-center gap-2">
                                    <Box size={16} className="text-green-600"/>
                                    {pkg.gmcTrackingNumber}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 mt-auto relative z-10 pt-2 border-t border-gray-100">
                               <Link 
                                    href={`/${locale}/dashboard-cliente/rastreo/${pkg.gmcTrackingNumber}`}
                                    className="w-full flex items-center justify-center gap-2 bg-gmc-dorado-principal hover:bg-yellow-600 text-white text-sm font-bold py-3 px-4 rounded-xl transition-all active:scale-[0.98] shadow-sm"
                                >
                                    📍 {tDelivered.has('trackPackage') ? tDelivered('trackPackage') : "Track Package"}
                                </Link>

                                <Link 
                                    href={`/${locale}/dashboard-cliente/paquetes/${pkg.id}`}
                                    className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg shadow-gray-200 active:scale-[0.98]"
                                >
                                    <ExternalLink size={16}/> {tDelivered.has('viewProof') ? tDelivered('viewProof') : "View Proof"}
                                </Link>
                                
                                {pkg.awbDocumentUrl && (
                                  <a 
                                    href={pkg.awbDocumentUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-100 hover:border-gray-200 text-gray-700 text-sm font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm uppercase tracking-wide"
                                  >
                                    📄 {tEnDestino.has('viewCustomsDoc') ? tEnDestino('viewCustomsDoc') : "Ver Documento Aduanal"}
                                  </a>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Package size={32} className="text-gray-300"/>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{tDelivered.has('noDeliveries') ? tDelivered('noDeliveries') : "No deliveries found"}</h3>
            <p className="text-gray-500 text-sm mt-1">{tDelivered.has('trySearch') ? tDelivered('trySearch') : "Try another search term."}</p>
        </div>
      )}
    </div>
  );
}

function CheckCircleIcon({ size }: { size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
    );
}