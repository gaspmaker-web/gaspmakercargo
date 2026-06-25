"use client";

import React, { useState, useMemo } from 'react';
import { Search, MapPin, Calendar, Plane, ExternalLink, Box, Copy, Truck, Scale, ArrowRight, Check, ChevronDown, ChevronUp, Package } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getTrackingUrl } from '@/lib/getTrackingUrl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AwbDownloadButton from './AwbDownloadButton'; 

interface Props {
  packages: any[];
  userCountryCode: string;
}

export default function InTransitPackagesCarousel({ packages, userCountryCode }: Props) {
  const t = useTranslations('PackageDetail'); 
  const tPage = useTranslations('InTransitPage');
  
  const params = useParams();
  const locale = params?.locale || 'es';

  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedMasterId, setExpandedMasterId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

 const getStatusLabel = (status: string, isLocal: boolean) => {
    if (!status) return 'PROCESANDO...';
    const upperStatus = status.toUpperCase();
    
    // 🔥 NUEVO GATILLO: CAPTURA DE "PAGADO"
    if (upperStatus === 'PAGADO' || upperStatus === 'PAID') {
        return tPage.has('pagado') ? tPage('pagado') : 'PAGADO';
    }

    if (upperStatus === 'EN_TRANSITO' || upperStatus === 'IN_TRANSIT') {
        return isLocal ? (tPage.has('enRuta') ? tPage('enRuta') : 'EN RUTA') : (tPage.has('enTransito') ? tPage('enTransito') : 'EN TRÁNSITO');
    }
    if (upperStatus === 'ENVIADO' || upperStatus === 'SHIPPED') {
        return tPage.has('enviado') ? tPage('enviado') : 'ENVIADO';
    }
    if (upperStatus === 'LISTO_PARA_ENVIO' || upperStatus === 'LISTO PARA ENVIO') {
        return tPage.has('listoParaEnvio') ? tPage('listoParaEnvio') : 'LISTO PARA ENVÍO';
    }
    
    if (upperStatus === 'EN_REPARTO' || upperStatus === 'OUT_FOR_DELIVERY') {
        return tPage.has('enReparto') ? tPage('enReparto') : 'EN REPARTO';
    }
    
    return status.replace(/_/g, ' ');
  };

  // 🔥 ESCÁNER INTELIGENTE DE PAÍS (TRIPLE RED DE SEGURIDAD)
  const getDestinationCountry = (realAddress: any, textDump: string, fallbackCode: string) => {
      let country = null;

      // 1. Intentar extraer del objeto ShippingAddress (si existe)
      if (realAddress) {
          if (typeof realAddress === 'object') {
              country = realAddress.country || realAddress.countryCode || realAddress.Country;
          } else if (typeof realAddress === 'string' && realAddress.startsWith('{')) {
              try {
                  const parsed = JSON.parse(realAddress);
                  country = parsed.country || parsed.countryCode || parsed.Country;
              } catch(e) {}
          }
      }
      if (country) return country.toUpperCase();

      // 2. Si la dirección viene vacía, analizar el nombre del Servicio/Courier
      const dump = textDump.toUpperCase();
      if (dump.includes('BARBADOS')) return 'BARBADOS';
      if (dump.includes('VENEZUELA')) return 'VENEZUELA';
      if (dump.includes('COLOMBIA')) return 'COLOMBIA';
      if (dump.includes('MEXICO') || dump.includes('MÉXICO')) return 'MÉXICO';
      if (dump.includes('DOMINICAN') || dump.includes('DOMINICANA')) return 'R. DOMINICANA';
      if (dump.includes('PANAMA') || dump.includes('PANAMÁ')) return 'PANAMÁ';
      if (dump.includes('COSTA RICA')) return 'COSTA RICA';
      if (dump.includes('TRINIDAD') || dump.includes('TOBAGO')) return 'TRINIDAD & TOBAGO';

      // 3. Último recurso absoluto
      return fallbackCode.toUpperCase();
  };

  const groupedData = useMemo(() => {
    const term = searchTerm.toLowerCase();
    
    const filtered = packages.filter(pkg => {
        const parent = pkg.consolidatedShipment;
        return (
            pkg.description?.toLowerCase().includes(term) ||
            pkg.gmcTrackingNumber?.toLowerCase().includes(term) ||
            pkg.carrierTrackingNumber?.toLowerCase().includes(term) ||
            parent?.finalTrackingNumber?.toLowerCase().includes(term) ||
            pkg.finalTrackingNumber?.toLowerCase().includes(term) 
        );
    });

    const masterMap = new Map(); 
    const loosePackages: any[] = []; 

    filtered.forEach(pkg => {
        if (pkg.consolidatedShipment) {
            const masterId = pkg.consolidatedShipment.id;
            if (!masterMap.has(masterId)) {
                masterMap.set(masterId, {
                    isMaster: true,
                    id: masterId,
                    data: pkg.consolidatedShipment, 
                    children: pkg.consolidatedShipment.packages || [pkg], 
                    createdAt: pkg.updatedAt || pkg.createdAt 
                });
            }
        } else {
            loosePackages.push({
                isMaster: false,
                id: pkg.id,
                data: pkg,
                createdAt: pkg.updatedAt || pkg.createdAt
            });
        }
    });

    return [...Array.from(masterMap.values()), ...loosePackages].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  }, [packages, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
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

      {groupedData.length > 0 ? (
        <div className="flex overflow-x-auto pb-12 -mx-4 px-4 gap-6 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent pt-2 items-start">
            {groupedData.map((item) => {
                
                const isMaster = item.isMaster;
                const parent = isMaster ? item.data : null;
                const pkg = isMaster ? item.children[0] : item.data; 
                
                const internalTracking = isMaster ? (parent?.gmcShipmentNumber || parent?.id.slice(0,8).toUpperCase()) : (pkg.gmcTrackingNumber || t('processing'));
                const easyPostTracking = isMaster 
    ? (parent?.finalTrackingNumber || item.children?.[0]?.finalTrackingNumber)
    : pkg.finalTrackingNumber;
    
                const displayCourier = isMaster 
                    ? (parent?.selectedCourier || item.children?.[0]?.selectedCourier || 'Gasp Maker Cargo') 
                    : (pkg.selectedCourier || pkg.consolidatedShipment?.selectedCourier || 'Gasp Maker Cargo');
                
                const isGMC = displayCourier.toUpperCase().includes('GASP') || displayCourier.toUpperCase().includes('MAKER') || displayCourier.toUpperCase().includes('MARITIMO');

                const textDump = [
                    isMaster ? parent?.courierService : pkg.courierService,
                    isMaster ? parent?.selectedCourier : pkg.selectedCourier,
                    isMaster ? parent?.serviceType : pkg.serviceType
                ].filter(Boolean).join(" ").toUpperCase();

                const isLocalDelivery = textDump.includes('LOCAL DELIVERY') || 
                                        textDump.includes('AURA') || 
                                        textDump.includes('LOCAL_DELIVERY');

                const trackingUrl = (easyPostTracking && !isGMC)
                    ? getTrackingUrl(displayCourier, easyPostTracking)
                    : "#";

                const awbUrl = isMaster 
                    ? (parent?.awbDocumentUrl || item.children?.[0]?.awbDocumentUrl || item.children?.[0]?.consolidatedShipment?.awbDocumentUrl) 
                    : (pkg.awbDocumentUrl || pkg.consolidatedShipment?.awbDocumentUrl);
                
                const totalWeight = isMaster 
                    ? item.children.reduce((acc: number, child: any) => acc + (child.weightLbs || 0), 0)
                    : (pkg.weightLbs || 0);

                const mainStatus = isMaster ? (parent?.status || pkg.status) : pkg.status;

                // Buscamos la dirección
                const realAddress = isMaster 
                    ? (parent?.shippingAddress || item.children?.[0]?.shippingAddress) 
                    : (pkg.shippingAddress || pkg.consolidatedShipment?.shippingAddress);
                
                // 🔥 APLICAMOS EL ESCÁNER INTELIGENTE
                const finalDestinationCountry = getDestinationCountry(realAddress, textDump, userCountryCode);

                return (
                    <div 
                        key={item.id} 
                        className="min-w-[350px] max-w-[350px] bg-white rounded-[2rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border border-gray-100 snap-center transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(59,130,246,0.15)] flex flex-col relative overflow-hidden group"
                    >
                        <div className={`backdrop-blur-md p-5 border-b border-gray-100 flex justify-between items-center ${isLocalDelivery ? 'bg-slate-800' : 'bg-slate-50/80'}`}>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border ${isLocalDelivery ? 'bg-black text-white border-gray-700' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                                {isLocalDelivery ? <Truck size={12} className="animate-pulse"/> : <Plane size={12} className="animate-pulse"/>} 
                                {getStatusLabel(mainStatus, isLocalDelivery)}
                            </span>
                            <span className={`text-xs font-mono font-medium flex items-center gap-1 ${isLocalDelivery ? 'text-gray-400' : 'text-gray-400'}`}>
                                <Calendar size={12}/>
                                {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                        </div>

                        <div className="p-6 flex-1 flex flex-col gap-5">
                            
                            <div className="flex items-center justify-between text-xs text-gray-500 font-bold uppercase tracking-wide">
                                <div className="flex items-center gap-1">
                                    <div className={`w-2 h-2 rounded-full ${isLocalDelivery ? 'bg-black' : 'bg-gray-300'}`}></div>
                                    MIA
                                </div>
                                <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-2 relative top-[1px]">
                                    <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 bg-white px-1">
                                        {isLocalDelivery ? (
                                            <Truck size={14} className="text-black" />
                                        ) : (
                                            <Plane size={12} className="text-blue-400 rotate-90" />
                                        )}
                                    </div>
                                </div>
                                <div className={`flex items-center gap-1 ${isLocalDelivery ? 'text-black' : 'text-blue-600'}`}>
                                    {/* 🔥 DESTINO INTELIGENTE */}
                                    {isLocalDelivery ? 'LOCAL' : finalDestinationCountry}
                                    <div className={`w-2 h-2 rounded-full animate-pulse ${isLocalDelivery ? 'bg-black' : 'bg-blue-600'}`}></div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-gray-800 text-lg line-clamp-1 mb-1 capitalize">
                                    {isMaster 
                                        ? `${item.children.length} ${item.children.length === 1 
                                            ? (tPage.has('paqueteConsolidado') ? tPage('paqueteConsolidado') : 'Paquete Consolidado') 
                                            : (tPage.has('paquetesConsolidados') ? tPage('paquetesConsolidados') : 'Paquetes Consolidados')}` 
                                        : (pkg.description || t('noDescription'))}
                                </h3>
                                <div className="flex items-center gap-2">
                                    {isMaster && (
                                        <span title="Consolidado" className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${isLocalDelivery ? 'bg-gray-100 text-gray-800 border-gray-300' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                                            <Box size={10}/> CONSOLIDATED
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-400 font-medium line-clamp-1">
                                        {displayCourier} {isLocalDelivery && !displayCourier.toUpperCase().includes('AURA') ? '- Local Delivery' : ''}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 group-hover:border-blue-200 transition-colors relative">
                                <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest mb-1">
                                    {isMaster ? 'MASTER TRACKING' : t('tracking')}
                                </p>
                                <div className="flex justify-between items-center">
                                    <p className="font-mono text-base font-bold text-slate-800 truncate tracking-tight">
                                        {internalTracking}
                                    </p>
                                    <button 
                                        onClick={() => handleCopy(internalTracking, item.id)}
                                        className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                                        title="Copy"
                                    >
                                        {copiedId === item.id ? <Check size={16} className="text-green-500"/> : <Copy size={16}/>}
                                    </button>
                                </div>
                                
                                {easyPostTracking && !isGMC && !isLocalDelivery && (
                                    <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center">
                                        <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">
                                            {displayCourier}:
                                        </p>
                                        <span className="font-mono text-xs font-bold text-blue-600 truncate">
                                            {easyPostTracking}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3 mt-auto">
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">{isMaster ? 'TOTAL WEIGHT' : t('weight')}</p>
                                        <div className="flex items-baseline gap-1">
                                            <Scale size={14} className="text-gray-400" />
                                            <span className="text-xl font-bold text-slate-800">{Number(totalWeight).toFixed(1)}</span>
                                            <span className="text-xs font-bold text-gray-400">lb</span>
                                        </div>
                                    </div>
                                </div>

                                {isGMC || isLocalDelivery ? (
                                    <Link 
                                        href={`/${locale}/dashboard-cliente/rastreo/${internalTracking}`}
                                        className={`w-full flex items-center justify-center gap-2 text-white text-sm font-bold py-3 px-4 rounded-xl transition-all active:scale-[0.98] shadow-sm ${isLocalDelivery ? 'bg-black hover:bg-gray-800' : 'bg-gmc-dorado-principal hover:bg-yellow-600'}`}
                                    >
                                        {isLocalDelivery ? <Truck size={16}/> : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                                                <circle cx="12" cy="10" r="3"/>
                                            </svg>
                                        )}
                                        {tPage('trackPackage') || "Rastrear Paquete"}
                                    </Link>
                                ) : easyPostTracking ? (
                                    <a
                                        href={trackingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg bg-blue-600 hover:bg-blue-700 active:scale-95"
                                    >
                                        {t('trackBtn') || "Track in Courier"} <ExternalLink size={16}/>
                                    </a>
                                ) : (
                                    <button
                                        type="button"
                                        disabled={true}
                                        className="w-full py-3 px-4 rounded-xl text-xs font-bold text-gray-500 bg-gray-100 flex items-center justify-center gap-1 cursor-not-allowed border border-gray-200"
                                    >
                                        {t('processing') || "Procesando Guía..."}
                                    </button>
                                )}

                                <AwbDownloadButton 
                                    url={awbUrl} 
                                    label={tPage.has('viewCustomsDoc') ? tPage('viewCustomsDoc') : "VER DOCUMENTO ADUANAL"} 
                                />

                                {isMaster && (
                                    <div className="mt-2 border-t border-gray-100 pt-3">
                                        <button
                                            onClick={() => setExpandedMasterId(expandedMasterId === item.id ? null : item.id)}
                                            className="w-full flex items-center justify-center gap-2 text-blue-600 text-xs font-bold hover:text-blue-800 transition-colors py-2"
                                        >
                                            <Package size={14} />
                                            {tPage.has('viewPackages') ? tPage('viewPackages') : 'VER PAQUETES'} 
                                            ({item.children.length})
                                            {expandedMasterId === item.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </button>

                                        {expandedMasterId === item.id && (
                                            <div className="mt-3 space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 animate-in slide-in-from-top-2 fade-in duration-200 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
                                                {item.children.map((childPkg: any) => (
                                                    <div key={childPkg.id} className="flex flex-col bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                                        <div className="flex justify-between items-start">
                                                            <span className="text-xs font-bold text-gray-800 capitalize line-clamp-1">{childPkg.description || 'Paquete'}</span>
                                                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{childPkg.weightLbs} lb</span>
                                                        </div>
                                                        <span className="text-[10px] font-mono text-gray-400 mt-1">{childPkg.gmcTrackingNumber}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
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
            <h3 className="text-xl font-bold text-gray-900">{tPage('noActiveShipments') || "No active shipments"}</h3>
            <p className="text-gray-500 text-sm mt-2 px-6">
                {tPage('noTransitMsg') || "You don't have any packages in transit right now."} <br/>
                {tPage('transitAppearMsg') || "Your shipments will appear here when they leave Miami."}
            </p>
        </div>
      )}
    </div>
  );
}