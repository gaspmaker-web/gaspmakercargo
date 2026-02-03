"use client";

import { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';
import Link from 'next/link';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('gmc_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('gmc_cookie_consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-[9999] animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="bg-white p-5 rounded-2xl shadow-2xl border border-gray-100 flex flex-col gap-4 relative">
        
        <button 
            onClick={() => setIsVisible(false)} 
            className="absolute top-2 right-2 text-gray-300 hover:text-gray-500 p-1"
        >
            <X size={16} />
        </button>

        <div className="flex gap-3">
            <div className="bg-blue-50 w-10 h-10 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                <Cookie size={20} />
            </div>
            <div>
                <h4 className="font-bold text-gray-800 text-sm">Usamos Cookies 🍪</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Utilizamos cookies esenciales para gestionar tu sesión, recordar tu idioma y garantizar la seguridad del envío. 
                    {/* 🔥 ENLACE CORREGIDO AQUÍ */}
                    <Link href="/privacy-policy" className="text-blue-600 hover:underline ml-1 font-bold">
                        Política de Privacidad
                    </Link>.
                </p>
            </div>
        </div>

        <div className="flex gap-2 mt-1">
            <button 
                onClick={acceptCookies}
                className="flex-1 bg-gasp-maker-dark-gray text-white py-2 rounded-lg text-xs font-bold hover:bg-black transition-colors shadow-md"
            >
                Aceptar todas
            </button>
            <button 
                onClick={acceptCookies} 
                className="px-4 py-2 bg-gray-50 text-gray-500 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors"
            >
                Solo necesarias
            </button>
        </div>

      </div>
    </div>
  );
}