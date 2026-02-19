"use client";

import React from 'react';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('HomePage.Footer');
  // 1. Agregamos el hook para llamar los textos del aviso de afiliados
  const tAffiliate = useTranslations('AffiliateDisclaimer');

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
            &copy; {new Date().getFullYear()} GaspMakerCargo {t('copyright')}
        </p>
        
      </div>
    </footer>
  );
}