"use client";

import React from 'react';
import { useTranslations } from 'next-intl';

export default function GeneralInfoClient() {
  const t = useTranslations('Navigation'); 

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Información General</h1>
        <p className="text-gray-600">
          Esta página está en construcción. Pronto encontrarás más información aquí.
        </p>
      </div>
    </div>
  );
}