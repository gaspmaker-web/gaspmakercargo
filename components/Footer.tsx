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
      {/* ... resto igual ... */}
    </footer>
  );
}