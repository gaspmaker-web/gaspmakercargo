"use client";

import React from 'react';
import { useTranslations } from 'next-intl';

interface FooterProps {
  tenantSlug?: string;
}

export default function Footer({ tenantSlug }: FooterProps) {
  const t = useTranslations('HomePage.Footer');
  const tAffiliate = useTranslations('AffiliateDisclaimer');

 // 🏢 Si es CargoOS, no mostrar footer
  if (tenantSlug === 'cargoos') return null;

  return (
    <footer className="bg-gmc-gris-oscuro py-8 text-center mt-auto w-full border-t border-gray-800">
      <div className="max-w-4xl mx-auto px-6 space-y-3">
        <p className="text-gray-400 text-xs font-bold">
          {tAffiliate('title')}
        </p>
        <p className="text-gray-400 text-xs leading-relaxed">
          {tAffiliate('text')}
        </p>
        <p className="text-gray-400 text-xs">
          {tAffiliate('amazon')}
        </p>
        <p className="text-gray-500 text-xs">
          ©️ {new Date().getFullYear()} Gasp Maker LLC. All rights reserved.
        </p>
      </div>
    </footer>
  );
}