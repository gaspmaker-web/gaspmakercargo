"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { X, Globe, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function MenuMovilClient() {
  const t = useTranslations('Navigation');
  const router = useRouter();
  const pathname = usePathname();

  // Configuración de idiomas (Lógica original)
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
    // 1. FONDO LUXURY (Degradado Oscuro Navy/Negro)
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#0f172a] to-[#1e1b4b] text-white font-montserrat overflow-y-auto animate-in fade-in duration-300">
      
      {/* Efectos de fondo (Luces ambientales) */}
      <div className="fixed top-[-20%] right-[-10%] w-[300px] h-[300px] bg-gmc-dorado-principal/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[250px] h-[250px] bg-blue-900/30 blur-[100px] rounded-full pointer-events-none" />

      {/* --- CABECERA --- */}
      <div className="relative z-10 flex items-center justify-end p-6 pt-8">
        {/* Botón Cerrar (X) - Estilo Glass */}
        <button 
            onClick={() => router.back()} 
            className="p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/20 hover:bg-white/20 hover:scale-105 transition-all shadow-lg shadow-black/20"
        >
            <X size={24} />
        </button>
      </div>

      {/* --- CONTENIDO --- */}
      <div className="relative z-10 px-6 pb-12 space-y-8">

        {/* TARJETA 1: SELECTOR DE IDIOMAS (Glassmorphism) */}
        <div>
            <div className="flex items-center gap-2 mb-4 px-1">
                <Globe size={14} className="text-gmc-dorado-principal"/>
                <p className="text-[10px] text-gmc-dorado-principal/80 uppercase tracking-[2px] font-bold">Idioma / Language</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-5 shadow-2xl shadow-black/20">
                <div className="grid grid-cols-2 gap-3">
                    {languages.map((lang) => {
                        const isActive = currentLocale === lang.code;
                        return (
                            <button
                                key={lang.code}
                                onClick={() => handleLanguageChange(lang.code)}
                                className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all border ${
                                    isActive 
                                    // Activo: Dorado Brillante
                                    ? 'bg-gmc-dorado-principal border-gmc-dorado-principal text-[#1a1f2e] shadow-lg shadow-yellow-500/20 font-bold scale-[1.02]' 
                                    // Inactivo: Glass oscuro
                                    : 'bg-white/5 border-transparent hover:bg-white/10 text-gray-300 font-medium'
                                }`}
                            >
                                <img src={lang.flag} alt={lang.name} className="w-5 h-auto rounded-[2px] shadow-sm opacity-90" />
                                <span className="text-sm">{lang.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* TARJETA 2: NAVEGACIÓN (Glassmorphism Premium) */}
        <div>
            <div className="flex items-center gap-2 mb-4 px-1">
                <div className="w-1.5 h-1.5 bg-gmc-dorado-principal rounded-full shadow-[0_0_10px_#fbbf24]"></div>
                <p className="text-[10px] text-gmc-dorado-principal/80 uppercase tracking-[2px] font-bold">Navegación</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl shadow-black/30">
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
        <div className="text-center pt-8 opacity-60">
            <p className="text-xs font-garamond italic text-gmc-dorado-principal">Gasp Maker Cargo &copy; {new Date().getFullYear()}</p>
        </div>

      </div>
    </div>
  );
}

// Componente auxiliar para los items (Estilo Oscuro)
function NavItem({ href, label, isLast = false }: { href: string, label: string, isLast?: boolean }) {
    return (
        <Link 
            href={href} 
            className={`flex items-center justify-between p-5 hover:bg-white/10 transition-all group ${
                !isLast ? 'border-b border-white/5' : ''
            }`}
        >
            <span className="text-gray-200 font-bold uppercase text-xs tracking-[1.5px] group-hover:text-gmc-dorado-principal transition-colors duration-300 group-hover:translate-x-1">
                {label}
            </span>
            <ChevronRight 
                size={16} 
                className="text-gray-500 group-hover:text-gmc-dorado-principal transition-colors duration-300" 
            />
        </Link>
    );
}