'use client';

import React, { useState, useRef, useEffect, useTransition } from 'react';
import { useLocale } from 'next-intl';
// 🚨 MANTENIENDO TU IMPORTACIÓN CLAVE DESDE @/navigation
import { useRouter, usePathname } from '@/navigation';
import { ChevronDown, Check } from 'lucide-react';

// Constantes para el diseño limpio
const LANGUAGES = [
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'pt', label: 'Português', flag: '🇧🇷' }
];

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname(); // Tu pathname "limpio"
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  // Estados para el diseño profesional (Dropdown)
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Idioma actual para mostrar en el botón
  const currentLang = LANGUAGES.find(l => l.code === locale) || LANGUAGES[0];

  // Lógica para cerrar el menú al hacer clic fuera
  useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
              setIsOpen(false);
          }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = async (nextLocale: string) => {
    if (nextLocale === locale) {
        setIsOpen(false);
        return;
    }
    setIsOpen(false);

    // 🔥 Guardar preferredLocale en DB
    try {
      await fetch('/api/user/update-locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: nextLocale })
      });
    } catch (e) {
      console.error('Error saving locale:', e);
    }

    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      
      {/* BOTÓN TRIGGER (Diseño Profesional) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={`
            flex items-center justify-between w-full min-w-[150px] px-4 py-2.5 
            bg-white border border-gray-300 rounded-lg shadow-sm 
            hover:border-gmc-dorado-principal focus:outline-none focus:ring-2 focus:ring-gmc-dorado-principal/20 
            transition-all duration-200
            ${isPending ? 'opacity-60 cursor-wait' : ''}
        `}
      >
        <div className="flex items-center gap-3">
            <span className="text-lg leading-none">{currentLang.flag}</span>
            <span className="text-sm font-medium text-gmc-gris-oscuro">{currentLang.label}</span>
        </div>
        <ChevronDown 
            size={16} 
            className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* MENÚ DESPLEGABLE (Abre hacia ARRIBA) */}
      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-full min-w-[160px] bg-white rounded-xl shadow-xl border border-gray-100 ring-1 ring-black ring-opacity-5 z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden origin-bottom-left">
            <div className="py-1">
                {LANGUAGES.map((lang) => {
                    const isActive = lang.code === locale;
                    return (
                        <button
                            key={lang.code}
                            onClick={() => handleSelect(lang.code)}
                            disabled={isPending}
                            className={`
                                w-full text-left px-4 py-3 text-sm flex items-center justify-between group
                                transition-colors duration-150
                                ${isActive ? 'bg-green-50 text-green-800 font-semibold' : 'text-gray-700 hover:bg-gray-50'}
                            `}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-lg">{lang.flag}</span>
                                <span>{lang.label}</span>
                            </div>
                            
                            {isActive && (
                                <Check size={16} className="text-green-600" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
      )}
    </div>
  );
}