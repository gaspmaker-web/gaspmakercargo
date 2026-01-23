"use client";

import React from 'react';
import { useTranslations } from 'next-intl';

export default function Footer() {
  // Conectamos con el archivo de traducciones
  const t = useTranslations('HomePage.Footer');

  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="container mx-auto px-4 py-6 text-center">
        <p className="text-gray-500 text-sm">
            {/* Año Dinámico + Nombre + Texto Traducido */}
            &copy; {new Date().getFullYear()} GaspMakerCargo. {t('copyright')}
        </p>
      </div>
    </footer>
  );
}