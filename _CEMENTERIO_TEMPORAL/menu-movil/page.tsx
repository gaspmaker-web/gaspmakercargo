"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { X, Globe, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function MenuMovilPage() {
  const t = useTranslations('Navigation');
  const router = useRouter();
  const pathname = usePathname();

  // Configuración de idiomas
  const languages = [
    { code: 'es', name: 'Español', flag: 'https://flagcdn.com/w20/es.png' },
    { code: 'en', name: 'English', flag: 'https://flagcdn.com/w20/us.png' },
    { code: 'fr', name: 'Français', flag: 'https://flagcdn.com/w20/fr.png' },
    { code: 'pt', name: 'Português', flag: 'https://flagcdn.com/w20/br.png' },
  ];

  const segments = pathname.split('/');
  const currentLocale = segments[1] || 'es';

  const handleLanguageChange = (code: string) => {
    const newSegments = [...segments];
    if (newSegments.length > 1) {
        newSegments[1] = code;
    } else {
        newSegments.splice(1, 0, code);
    }
    const newPath = newSegments.join('/') || `/${code}`;
    router.push(newPath);
  };

  return (
    // 1. FONDO CLARO (Estilo Dashboard)
    <div className="fixed inset-0 z-50 bg-gray-50 text-gray-900 font-montserrat overflow-y-auto animate-in fade-in duration-200">
      
      {/* --- CABECERA LIMPIA (Sin título "Menú") --- */}
      <div className="flex items-center justify-end p-6 pt-8">
        {/* Botón Cerrar (X) - Oscuro para contrastar con el fondo claro */}
        <button 
            onClick={() => router.back()} 
            className="p-2 bg-white rounded-full text-gray-500 hover:text-gray-900 shadow-sm border border-gray-200 hover:bg-gray-100 transition-all"
        >
            <X size={26} />
        </button>
      </div>

      {/* --- CONTENIDO --- */}
      <div className="px-6 pb-12 space-y-8">

        {/* TARJETA 1: SELECTOR DE IDIOMAS (Fondo Blanco) */}
        <div>
            <div className="flex items-center gap-2 mb-3 px-1">
                <Globe size={14} className="text-gmc-dorado-principal"/>
                <p className="text-[10px] text-gray-400 uppercase tracking-[2px] font-bold">Idioma / Language</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <div className="grid grid-cols-2 gap-3">
                    {languages.map((lang) => {
                        const isActive = currentLocale === lang.code;
                        return (
                            <button
                                key={lang.code}
                                onClick={() => handleLanguageChange(lang.code)}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${
                                    isActive 
                                    // Activo: Dorado con texto negro
                                    ? 'bg-gmc-dorado-principal border-gmc-dorado-principal text-[#1a1f2e] shadow-md font-bold' 
                                    // Inactivo: Gris muy claro con texto gris
                                    : 'bg-gray-50 border-transparent hover:bg-gray-100 text-gray-600 font-medium'
                                }`}
                            >
                                <img src={lang.flag} alt={lang.name} className="w-5 h-auto rounded-sm shadow-sm" />
                                <span className="text-sm">{lang.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* TARJETA 2: NAVEGACIÓN (Fondo Blanco) */}
        <div>
            <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-1.5 h-1.5 bg-gmc-dorado-principal rounded-full"></div>
                <p className="text-[10px] text-gray-400 uppercase tracking-[2px] font-bold">Navegación</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
                <NavItem href="/como-funciona" label={t('howItWorks')} />
                <NavItem href="/servicios" label={t('services')} />
                <NavItem href="/calculadora-costos" label={t('calculator')} />
                <NavItem href="/acerca-de-nosotros" label={t('aboutUs')} />
                <NavItem href="/faq" label={t('faq')} />
                <NavItem href="/testimonios" label={t('testimonials')} />
                <NavItem href="/ubicaciones" label={t('locations')} isLast />
            </div>
        </div>

        {/* Footer de Marca */}
        <div className="text-center text-gray-300 pt-6">
            <p className="text-xs font-garamond italic">Gasp Maker Cargo &copy; {new Date().getFullYear()}</p>
        </div>

      </div>
    </div>
  );
}

// Componente auxiliar para los items (Adaptado a tema claro)
function NavItem({ href, label, isLast = false }: { href: string, label: string, isLast?: boolean }) {
    return (
        <Link 
            href={href} 
            className={`flex items-center justify-between p-5 hover:bg-gray-50 transition-all group ${!isLast ? 'border-b border-gray-100' : ''}`}
        >
            <span className="text-gray-700 font-bold uppercase text-xs tracking-[1px] group-hover:text-gmc-dorado-principal transition-colors">
                {label}
            </span>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-gmc-dorado-principal transition-colors" />
        </Link>
    );
}