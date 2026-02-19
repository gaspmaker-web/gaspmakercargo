"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { ShoppingBag, ExternalLink } from 'lucide-react';

// 🛒 TUS ENLACES DE AFILIADO
const AFFILIATE_STORES = [
  { id: 'amazon', name: 'Amazon', bg: 'bg-[#FF9900]', url: 'https://www.amazon.com/?tag=TU_AFILIADO' },
  { id: 'ebay', name: 'eBay', bg: 'bg-[#E53238]', url: 'https://www.ebay.com/' },
  { id: 'shein', name: 'Shein', bg: 'bg-[#222222]', url: 'https://us.shein.com/' },
  { id: 'walmart', name: 'Walmart', bg: 'bg-[#0071CE]', url: 'https://www.walmart.com/' },
  { id: 'temu', name: 'Temu', bg: 'bg-[#FF7000]', url: 'https://www.temu.com/' },
  { id: 'aliexpress', name: 'AliExpress', bg: 'bg-[#FF4747]', url: 'https://www.aliexpress.com/' }
];

export default function RecommendedStores() {
  const t = useTranslations('HomePage.RecommendedStores');

  return (
    <section className="py-16 bg-white w-full border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado de la sección */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gmc-gris-oscuro font-garamond flex items-center justify-center gap-3">
            <ShoppingBag className="text-gmc-dorado-principal" size={32} />
            {t('title')}
          </h2>
          <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-sm md:text-base">
            {t('description')}
          </p>
        </div>

        {/* Cuadrícula de Tiendas */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {AFFILIATE_STORES.map((store) => (
            <a
              key={store.id}
              href={store.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-50 border border-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 hover:border-blue-300 hover:shadow-xl hover:-translate-y-1 transition-all group"
            >
              {/* Círculo con la inicial */}
              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-white shadow-md ${store.bg}`}>
                <span className="font-bold text-2xl md:text-3xl">{store.name.charAt(0)}</span>
              </div>
              
              {/* Texto */}
              <div className="text-center">
                <p className="font-bold text-gray-800 text-sm md:text-base group-hover:text-blue-600 transition-colors">
                  {store.name}
                </p>
                <span className="text-[10px] text-gray-400 font-bold uppercase flex items-center justify-center gap-1 mt-1 group-hover:text-blue-500">
                  {t('shopNow')} <ExternalLink size={10} />
                </span>
              </div>
            </a>
          ))}
        </div>

      </div>
    </section>
  );
}