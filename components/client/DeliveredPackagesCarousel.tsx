'use client';

import React, { useState } from 'react';
import { Search, MapPin, Calendar, Package, ExternalLink, Box, Copy, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
// 🔥 1. Importamos el hook
import { useTranslations } from 'next-intl';

interface Props {
  packages: any[];
  userCountryCode: string;
}

export default function DeliveredPackagesCarousel({ packages, userCountryCode }: Props) {
  // 🔥 2. Inicializamos traducciones
  const t = useTranslations('PackageDetail');
  const tDelivered = useTranslations('DeliveredPage');

  const params = useParams();
  const locale = params?.locale || 'es'; 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtramos en tiempo real
  const filteredPackages = packages.filter(pkg => 
    pkg.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.gmcTrackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.carrierTrackingNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
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
      {filteredPackages.length > 0 ? (
        <div className="flex overflow-x-auto pb-10 -mx-4 px-4 gap-6 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent pt-2">
            {filteredPackages.map((pkg) => (
                <div 
                    key={pkg.id} 
                    className="min-w-[340px] max-w-[340px] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6 snap-center transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] flex flex-col justify-between relative overflow-hidden group"
                >
                    {/* Decoración de fondo */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-50 to-transparent rounded-bl-full -mr-4 -mt-4 opacity-50"></div>

                    {/* Encabezado */}
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <span className="bg-green-100/80 backdrop-blur-sm text-green-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-green-200">
                                <CheckCircleIcon size={12}/> {tDelivered('statusDelivered') || "Delivered"}
                            </span>
                            <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                                <Calendar size={12}/>
                                {new Date(pkg.updatedAt || pkg.createdAt).toLocaleDateString()}
                            </span>
                        </div>

                        {/* Título y Ubicación */}
                        <div className="mb-5">
                            <h3 className="font-bold text-gray-800 text-xl line-clamp-1 mb-1 capitalize tracking-tight">
                                {pkg.description || t('noDescription')}
                            </h3>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                <MapPin size={14} className="text-gray-400"/>
                                <span>{tDelivered('destination') || "Destination"}: <strong className="text-gray-700">{userCountryCode}</strong></span>
                            </div>
                        </div>

                        {/* Tarjeta de Tracking Interna */}
                        <div className="bg-gray-50 rounded-xl p-3 mb-5 border border-gray-200/60 group-hover:border-green-200 transition-colors">
                            <div className="flex justify-between items-center mb-1">
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{t('tracking')}</p>
                                <button 
                                    onClick={() => handleCopy(pkg.gmcTrackingNumber, pkg.id)}
                                    className="text-gray-400 hover:text-green-600 transition-colors"
                                    title="Copy"
                                >
                                    {copiedId === pkg.id ? <CheckCircle size={14} className="text-green-500"/> : <Copy size={14}/>}
                                </button>
                            </div>
                            <div className="font-mono text-sm font-bold text-gray-800 truncate flex items-center gap-2">
                                <Box size={16} className="text-green-600"/>
                                {pkg.gmcTrackingNumber}
                            </div>
                        </div>
                    </div>

                    {/* 🔥 BOTÓN CORREGIDO: Enlace interno a la prueba de entrega 🔥 */}
                    <Link 
                        href={`/${locale}/dashboard-cliente/paquetes/${pkg.id}`}
                        className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg shadow-gray-200 active:scale-[0.98]"
                    >
                        <ExternalLink size={16}/> {tDelivered('viewProof') || "View Proof"}
                    </Link>
                </div>
            ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Package size={32} className="text-gray-300"/>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{tDelivered('noDeliveries') || "No deliveries found"}</h3>
            <p className="text-gray-500 text-sm mt-1">{tDelivered('trySearch') || "Try another search term."}</p>
        </div>
      )}
    </div>
  );
}

// Icono auxiliar
function CheckCircleIcon({ size }: { size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
    );
}