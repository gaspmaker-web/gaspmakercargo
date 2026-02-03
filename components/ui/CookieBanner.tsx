"use client";

import { useState, useEffect } from 'react';
import { Cookie, X, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function CookieBanner() {
  const t = useTranslations('CookieBanner');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verificar si ya aceptó las cookies
    const consent = localStorage.getItem('gmc_cookie_consent');
    if (!consent) {
      // Pequeño retraso para una entrada elegante
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    // 1. Guardamos el consentimiento
    localStorage.setItem('gmc_cookie_consent', 'true');
    
    // 🔥 2. AVISAMOS A LA APP QUE SE ACEPTARON LAS COOKIES
    // Esto disparará el evento para que el Chat de Tawk.to aparezca
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cookie_consent_updated'));
    }

    // 3. Cerramos el banner
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed z-[9999] 
      /* MÓVIL: Pegado abajo, ancho completo, padding para que no toque bordes */
      bottom-0 left-0 right-0 w-full p-4
      /* ESCRITORIO: A la IZQUIERDA para equilibrar con el Chat (que está a la derecha) */
      md:bottom-8 md:left-8 md:right-auto md:w-[400px] md:p-0
    ">
      <div className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl md:rounded-3xl p-6 relative overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
        
        {/* Decoración de fondo (Brillo dorado sutil) */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

        <div className="relative z-10">
            
            {/* Header: Icono y Título */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-yellow-50 rounded-full text-yellow-600">
                        <Cookie size={20} />
                    </div>
                    <h4 className="font-bold text-gray-800 text-sm">
                        {t('title')}
                    </h4>
                </div>
                <button 
                    onClick={() => setIsVisible(false)} 
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Texto y Link */}
            <p className="text-gray-500 text-xs md:text-sm leading-relaxed mb-5 font-medium">
                {t('text')}{' '}
                <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-800 underline decoration-blue-200 hover:decoration-blue-600 transition-all font-bold">
                    {t('link')}
                </Link>.
            </p>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3">
                <button 
                    onClick={acceptCookies}
                    className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold text-xs hover:bg-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                    <ShieldCheck size={14} />
                    {t('acceptAll')}
                </button>
                <button 
                    onClick={acceptCookies} 
                    className="flex-1 bg-gray-50 text-gray-600 py-3 rounded-xl font-bold text-xs hover:bg-gray-100 transition-all border border-gray-100"
                >
                    {t('necessaryOnly')}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}