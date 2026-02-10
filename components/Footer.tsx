"use client";

import React from 'react';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('HomePage.Footer');

  return (
    // Usamos los mismos estilos que tenías en el layout
    <footer className="bg-gmc-gris-oscuro py-6 text-center mt-auto w-full border-t border-gray-800">
      <div className="container mx-auto px-4">
        <p className="text-sm text-gray-400 font-montserrat">
            {/* Año dinámico + Nombre + Traducción */}
            &copy; {new Date().getFullYear()} GaspMakerCargo {t('copyright')}
        </p>
      </div>
    </footer>
  );
}