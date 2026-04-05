"use client";

import React, { useState } from 'react';
import { Copy, MapPin, Check, ShoppingCart, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl'; 

interface AddressCardProps {
  recipient: string;  
  suiteNo: string;    
  address?: string; 
  cityZip?: string; 
  country?: string; 
  phone?: string; 
}

// 🛒 CONFIGURACIÓN DE TIENDAS AFILIADAS (Pega aquí tus links de referidos)
const AFFILIATE_STORES = [
  { id: 'amazon', name: 'Amazon', bg: 'bg-[#FF9900]', url: 'https://www.amazon.com/?tag=TU_AFILIADO' },
  { id: 'ebay', name: 'eBay', bg: 'bg-[#E53238]', url: 'https://www.ebay.com/' },
  { id: 'shein', name: 'Shein', bg: 'bg-[#222222]', url: 'https://us.shein.com/' },
  { id: 'walmart', name: 'Walmart', bg: 'bg-[#0071CE]', url: 'https://www.walmart.com/' },
  { id: 'temu', name: 'Temu', bg: 'bg-[#FF7000]', url: 'https://www.temu.com/' },
  { id: 'aliexpress', name: 'AliExpress', bg: 'bg-[#FF4747]', url: 'https://www.aliexpress.com/' }
];

// 🔥 BOTÓN DE COPIAR MEJORADO (Muestra ✅ al copiar)
const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Vuelve al ícono de copiar en 2s
  };

  return (
    <button 
      onClick={handleCopy} 
      className={`ml-2 transition-colors p-1.5 rounded-md flex-shrink-0 ${
        copied ? 'bg-green-50 text-green-600' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
      }`}
      title="Copiar"
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
    </button>
  );
};

// 🔥 MEJORA RESPONSIVA: Adaptado para no romperse en móviles
const AddressRow = ({ label, value, isHighlighted = false }: { label: string, value: string, isHighlighted?: boolean }) => (
  <div className={`flex flex-col sm:flex-row sm:items-center py-2.5 sm:py-2 border-b border-gray-50 last:border-0 ${isHighlighted ? 'bg-blue-50/50 -mx-4 sm:-mx-6 px-4 sm:px-6 border-blue-100' : ''}`}>
    <span className="text-xs sm:text-sm font-medium text-gray-500 sm:w-32 md:w-36 lg:w-32 flex-shrink-0 mb-1 sm:mb-0">
      {label}:
    </span>
    <div className="flex items-center justify-between flex-grow w-full sm:w-auto overflow-hidden">
        <span className={`font-bold truncate mr-2 ${isHighlighted ? 'text-blue-800 text-base sm:text-lg' : 'text-gmc-gris-oscuro text-sm sm:text-base'}`}>
          {value}
        </span>
        <CopyButton text={value} />
    </div>
  </div>
);

export default function AddressCard({ recipient, suiteNo }: AddressCardProps) {
  const t = useTranslations('AddressCard');
  
  const MIAMI_ADDRESS = "1861 NW 22nd St";
  const MIAMI_CITY_STATE = "Miami, FL 33142";
  const MIAMI_PHONE = "786-282-0763";
  const MIAMI_COUNTRY = "United States";

  return (
    // 🔥 GRID DE 12 COLUMNAS INTERNO PARA DISTRIBUCIÓN PERFECTA
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-stretch h-full">
      
      {/* =========================================
          1. TARJETA DE DIRECCIÓN (Estrecha: 5 de 12 columnas) 
          ========================================= */}
      <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-xl shadow-md border border-gray-100 flex flex-col justify-center overflow-hidden h-full">
        <div className="flex items-center gap-3 mb-3 pb-2 border-b border-gray-100">
          <div className="bg-blue-50 p-2 rounded-full text-blue-600 flex-shrink-0">
              <MapPin size={20} />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-gmc-gris-oscuro font-garamond truncate">
            {t('title')}
          </h3>
        </div>
        
        <div className="flex flex-col w-full flex-1 justify-center">
          <AddressRow label={t('recipient')} value={recipient} />
          <AddressRow label={t('address')} value={MIAMI_ADDRESS} />
          <AddressRow label={t('suite')} value={suiteNo || "PENDING"} isHighlighted={true} />
          <AddressRow label={t('cityZip')} value={MIAMI_CITY_STATE} />
          <AddressRow label={t('country')} value={MIAMI_COUNTRY} />
          <AddressRow label={t('phone')} value={MIAMI_PHONE} />
        </div>
      </div>

      {/* =========================================
          2. CARRUSEL DE AFILIADOS (Ancha: 7 de 12 columnas) 
          ========================================= */}
      <div className="lg:col-span-7 bg-white rounded-xl shadow-md border border-gray-100 flex flex-col overflow-hidden relative h-full">
        {/* Encabezado */}
        <div className="p-3 sm:p-4 border-b border-gray-50 bg-gradient-to-br from-blue-50/50 to-white shrink-0">
          <h3 className="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart size={16} className="text-gmc-dorado-principal flex-shrink-0"/>
            {t('affiliateTitle')}
          </h3>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1 leading-tight">
            {t('affiliateDesc')}
          </p>
        </div>

        {/* Contenedor del Carrusel (Deslizable) */}
        <div className="pt-4 px-2 sm:px-4 flex-1 flex flex-col justify-center bg-gray-50/30">
          <div className="flex overflow-x-auto gap-3 sm:gap-4 snap-x snap-mandatory pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {AFFILIATE_STORES.map((store) => (
              <a
                key={store.id}
                href={store.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-[90px] sm:min-w-[110px] snap-center bg-white border border-gray-200 rounded-2xl p-3 flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:shadow-md transition-all group"
              >
                {/* Círculo con el color de la marca y la primera letra */}
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white shadow-sm ${store.bg}`}>
                  <span className="font-bold text-lg sm:text-xl">{store.name.charAt(0)}</span>
                </div>
                
                <div className="text-center w-full mt-1">
                  <p className="font-bold text-gray-800 text-xs group-hover:text-blue-600 transition-colors truncate">
                    {store.name}
                  </p>
                  <span className="text-[9px] text-gray-400 font-bold uppercase flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 mt-1 group-hover:text-blue-500 w-full px-1 leading-tight text-center break-words">
                  <span className="line-clamp-2">{t('buyNow')}</span> 
                  <ExternalLink size={10} className="shrink-0" />
                  </span>
                </div>
              </a>
            ))}
            <div className="min-w-[5px] shrink-0"></div>
          </div>
        </div>
      </div>

    </div>
  );
}