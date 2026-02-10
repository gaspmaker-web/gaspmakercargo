"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation'; 
import Link from 'next/link';
import { Menu, ArrowLeft, ChevronDown, User } from 'lucide-react'; 
import ProfileButton from "@/components/ProfileButton";
import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from 'next-intl'; 
import NotificationBell from "@/components/ui/NotificationBell";

interface HeaderProps {
  backButtonUrl?: string; 
}

export default function Header({ backButtonUrl }: HeaderProps) {
  const t = useTranslations('Navigation'); 
  const currentLocale = useLocale(); 
  const pathname = usePathname();
  const router = useRouter();
  
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession(); 

  const isDashboard = pathname.includes('/dashboard-cliente') || pathname.includes('/menu') || pathname.includes('/account-settings');
  const isBillingPage = pathname.includes('/pagar-facturas');

  const isSubPage = 
    pathname.includes('/referidos') ||
    pathname.includes('/pre-alerta') ||
    pathname.includes('/solicitar-pickup') ||
    pathname.includes('/historial-solicitudes') ||
    pathname.includes('/en-transito') ||
    pathname.includes('/en-destino') ||
    pathname.includes('/pagar-facturas') || 
    pathname.includes('/notificaciones') ||
    pathname.includes('/account-settings') ||
    pathname.includes('/paquetes');

  const headerClasses = isDashboard 
    ? "bg-transparent fixed top-0 z-50 w-full h-[72px] transition-colors duration-300" 
    : "bg-gmc-gris-oscuro border-b border-white/5 backdrop-blur-md sticky top-0 z-50 shadow-2xl font-montserrat w-full h-[72px] transition-colors duration-300";

  const iconColorClass = isDashboard ? "text-[#1a1f2e]" : "text-white";

  const languages = [
    { code: 'es', name: 'Español', flag: 'https://flagcdn.com/w20/es.png' },
    { code: 'en', name: 'English', flag: 'https://flagcdn.com/w20/us.png' },
    { code: 'fr', name: 'Français', flag: 'https://flagcdn.com/w20/fr.png' },
    { code: 'pt', name: 'Português', flag: 'https://flagcdn.com/w20/br.png' },
  ];

  const currentLang = languages.find(l => l.code === currentLocale) || languages[0];

  const handleLanguageChange = (newLocale: string) => {
    if (newLocale === currentLocale) {
      setIsLangMenuOpen(false);
      return;
    }

    // Lógica para reemplazar el idioma en la URL
    const segments = pathname.split('/');
    // segments[0] es vacío, segments[1] es el idioma actual
    
    if (languages.some(l => l.code === segments[1])) {
      segments[1] = newLocale; // Reemplazamos (ej: /es/home -> /en/home)
    } else {
      segments.splice(1, 0, newLocale); // Insertamos si no existe
    }

    const newPath = segments.join('/');
    
    // 🚀 CAMBIO CLAVE: Usamos window.location.href
    // Esto fuerza una recarga completa del navegador. 
    // Es la forma más segura de cambiar idiomas sin errores de caché.
    window.location.href = newPath; 
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [langRef]);

  return (
    <header className={headerClasses}>
      <div className="container mx-auto px-4 h-full flex justify-between items-center relative z-50">
        
        {/* IZQUIERDA */}
        <div className="flex items-center gap-4">
            <div className="lg:hidden relative z-50">
                {isSubPage ? (
                    <button 
                        type="button"
                        onClick={() => router.back()} 
                        className={`flex items-center justify-center min-w-[48px] min-h-[48px] p-2 rounded-full transition-all active:scale-90 ${iconColorClass} ${
                            isDashboard ? "hover:bg-black/10 active:bg-black/20" : "hover:bg-white/10 active:bg-white/20"
                        }`}
                        aria-label="Volver atrás"
                    >
                        <ArrowLeft size={28} />
                    </button>
                ) : (
                    <Link 
                        href="/menu-movil" 
                        className={`flex items-center justify-center min-w-[48px] min-h-[48px] -ml-2 rounded-full transition-all active:scale-90 ${iconColorClass} ${
                            isDashboard ? "hover:bg-black/10 active:bg-black/20" : "hover:bg-white/10 active:bg-white/20"
                        }`}
                        aria-label="Abrir menú"
                    >
                        <Menu size={30} />
                    </Link>
                )}
            </div>

            <div className={`hidden lg:flex items-center flex-shrink-0 ${iconColorClass}`}>
                {isSubPage ? (
                    <button 
                        type="button"
                        onClick={() => router.back()} 
                        className={`hover:text-gmc-dorado-principal transition-all duration-300 ml-4 p-2 rounded-full hover:bg-black/5 active:scale-95`}
                        title="Volver"
                    >
                        <ArrowLeft size={24} />
                    </button>
                ) : (
                    <Link href="/" className="flex items-center group transition-transform hover:scale-105 active:scale-95">
                        <Image
                            src="/gaspmakercargoproject.png" 
                            alt="Gasp Maker Logo"
                            width={50}
                            height={50}
                            priority
                            className="object-contain"
                        />
                    </Link>
                )}
            </div>
        </div>

        {/* CENTRO */}
        {!isSubPage && !isBillingPage && (
            <div className={`hidden lg:flex items-center space-x-4 xl:space-x-6 ${iconColorClass}`}>
            <Link href="/como-funciona" className="text-[11px] xl:text-[13px] font-bold hover:text-gmc-dorado-principal transition-all uppercase tracking-[1px] opacity-90">{t('howItWorks')}</Link>
            <Link href="/servicios" className="text-[11px] xl:text-[13px] font-bold hover:text-gmc-dorado-principal transition-all uppercase tracking-[1px] opacity-90">{t('services')}</Link>
            <Link href="/calculadora-costos" className="text-[11px] xl:text-[13px] font-bold hover:text-gmc-dorado-principal transition-all uppercase tracking-[1px] opacity-90">{t('calculator')}</Link>
            <Link href="/acerca-de-nosotros" className="text-[11px] xl:text-[13px] font-bold hover:text-gmc-dorado-principal transition-all uppercase tracking-[1px] opacity-90">{t('aboutUs')}</Link>
            <Link href="/faq" className="text-[11px] xl:text-[13px] font-bold hover:text-gmc-dorado-principal transition-all uppercase tracking-[1px] opacity-90">{t('faq')}</Link>
            <Link href="/testimonios" className="text-[11px] xl:text-[13px] font-bold hover:text-gmc-dorado-principal transition-all uppercase tracking-[1px] opacity-90">{t('testimonials')}</Link>
            <Link href="/ubicaciones" className="text-[11px] xl:text-[13px] font-bold hover:text-gmc-dorado-principal transition-all uppercase tracking-[1px] opacity-90">{t('locations')}</Link>
            </div>
        )}

        {/* DERECHA */}
        <div className="flex items-center gap-2 md:gap-4 relative z-50">
          
          {!isSubPage && (
            <>
                {/* Idioma Desktop */}
                <div className="hidden lg:block relative" ref={langRef}>
                    <button 
                        type="button"
                        onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} 
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors border ${iconColorClass} ${
                            isDashboard ? "border-gray-300 hover:bg-black/5" : "bg-white/5 hover:bg-white/10 border-white/10"
                        }`}
                    >
                    <img src={currentLang.flag} alt={currentLang.name} className="w-5 h-auto rounded-sm shadow-sm" />
                    <ChevronDown size={14} className={`transition-transform duration-300 ${isLangMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isLangMenuOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-[#1a1f2e] text-white border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[60]">
                        {languages.map((lang) => (
                        <button 
                            key={lang.code} 
                            onClick={() => handleLanguageChange(lang.code)} 
                            className={`flex items-center gap-3 w-full px-4 py-3 text-sm hover:bg-white/10 transition-colors text-left ${
                                currentLocale === lang.code ? 'bg-white/5' : ''
                            }`}
                        >
                            <img src={lang.flag} alt={lang.name} className="w-5 h-auto rounded-sm" />
                            <span className={currentLocale === lang.code ? 'text-gmc-dorado-principal font-bold' : 'text-white/80'}>{lang.name}</span>
                        </button>
                        ))}
                    </div>
                    )}
                </div>

                {/* Notificaciones */}
                {session && (
                    <div className="flex items-center justify-center min-w-[40px] min-h-[40px] hover:scale-105 active:scale-95 transition-transform">
                        <NotificationBell className={iconColorClass} />
                    </div>
                )}

                {/* Perfil */}
                <div className="flex items-center">
                    {session ? (
                        <>
                            <div className="hidden lg:block">
                                <ProfileButton />
                            </div>
                            
                            {/* Icono Perfil Móvil */}
                            <Link 
                                href="/menu-perfil" 
                                className={`lg:hidden flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full font-bold shadow-sm border active:scale-90 transition-transform overflow-hidden ${
                                    isDashboard 
                                    ? "bg-[#1a1f2e] text-white border-transparent" 
                                    : "bg-gmc-dorado-principal text-black border-white/10"
                                }`}
                                aria-label="Mi Perfil"
                            >
                                <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
                                    {session.user?.image ? (
                                        <img 
                                            src={session.user.image} 
                                            alt="Perfil" 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-sm">
                                            {session.user?.name?.[0]?.toUpperCase() || <User size={18}/>}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        </>
                    ) : (
                        <Link 
                        href="/login-cliente"
                        className="px-3 py-2 lg:px-5 lg:py-2 bg-gmc-dorado-principal text-black font-bold rounded-lg hover:bg-[#e6c200] active:scale-95 transition-all text-sm shadow-md flex items-center gap-2"
                        >
                        <User size={18} />
                        <span className="hidden lg:inline">{t('access')}</span>
                        </Link>
                    )}
                </div>
            </>
          )}
          
        </div>
      </div>
    </header> 
  );
}

