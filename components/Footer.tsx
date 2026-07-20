"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { useTenant } from '@/hooks/useTenant';

export default function Footer() {
  const t = useTranslations('HomePage.Footer');
  const tAffiliate = useTranslations('AffiliateDisclaimer');
  
  const { tenant } = useTenant();
  // 🏢 Si es CargoOS landing, no mostrar footer de GaspMaker
  if (tenant?.slug === 'cargoos') return null;

  return (
    <footer className="bg-gmc-gris-oscuro py-8 text-center mt-auto w-full border-t border-gray-800">
      <div className="container mx-auto px-4 flex flex-col items-center gap-6">
        
        {/* =========================================
            1. AVISO LEGAL DE AFILIADOS (En fondo oscuro)
            ========================================= */}
        <div className="max-w-4xl text-[10px] md:text-xs text-gray-400 leading-relaxed text-center space-y-2 opacity-80">
          <p>
            <strong className="text-gray-300 font-bold">{tAffiliate('title')}:</strong> {tAffiliate('text')}
          </p>
          <p className="italic text-gray-500">
            {tAffiliate('amazon')}
          </p>
        </div>

        {/* =========================================
            2. LÍNEA DIVISORIA SUTIL
            ========================================= */}
        <div className="w-full h-px bg-gray-800/60 max-w-3xl"></div>

        {/* =========================================
            3. COPYRIGHT ORIGINAL
            ========================================= */}
        <p className="text-xs md:text-sm text-gray-500 font-montserrat">
            &copy; {new Date().getFullYear()} Gasp Maker LLC {t('copyright')}
        </p>
        
      </div>
    </footer>
  );
}