"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation'; 
import Link from 'next/link';
import { Menu, ArrowLeft, ChevronDown, User } from 'lucide-react'; 
import ProfileButton from "@/components/ProfileButton";
import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from 'next-intl'; // Importamos useLocale
import NotificationBell from "@/components/ui/NotificationBell";

interface HeaderProps {
  backButtonUrl?: string; 
}

export default function Header({ backButtonUrl }: HeaderProps) {
  const t = useTranslations('Navigation'); 
  const locale = useLocale(); // 🔥 IDIOMA ACTUAL
  const pathname = usePathname();
  const router = useRouter();
  
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession(); 

  // Detectar si estamos en dashboard
  const isDashboard = pathname.includes('/dashboard-cliente') || pathname.includes('/menu') || pathname.includes('/account-settings');
  const isBillingPage = pathname.includes('/pagar-facturas');

  // Sub-páginas
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
    ? "bg-transparent fixed top-0 z-40 w-full h-[72px] transition-colors duration-300" 
    : "bg-gmc-gris-oscuro border-b border-white/5 backdrop-blur-md sticky top-0 z-40 shadow-2xl font-montserrat w-full h-[72px] transition-colors duration-300";

  const iconColorClass = isDashboard ? "text-[#1a1f2e]" : "text-white";

  const languages = [
    { code: 'es', name: 'Español', flag: 'https://flagcdn.com/w20/es.png' },
    { code: 'en', name: 'English', flag: 'https://flagcdn.com/w20/us.png' },
    { code: 'fr', name: 'Français', flag: 'https://flagcdn.com/w20/fr.png' },
    { code: 'pt', name: 'Português', flag: 'https://flagcdn.com/w20/br.png' },
  ];
  
  const currentLang = languages.find(l => l.code === locale) || languages[0];

  // 🔥 Cambiamos el idioma usando window.location para forzar limpieza de caché
  const handleLanguageChange = (code: string) => {
    if (code === locale) {
        setIsLangMenuOpen(false);
        return;
    }
    const segments = pathname.split('/');
    if (languages.some(l => l.code === segments[1])) {
        segments[1] = code;
    } else {
        segments.splice(1, 0, code);
    }
    const newPath = segments.join('/') || `/${code}`;
    window.location.href = newPath; 
  };

  // 🔥 REGRESAR AL DASHBOARD (Para la flecha <-)
  const handleBackToDashboard = () => {
    router.push(`/${locale}/dashboard-cliente`);
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

  // 🔥 ESTA ES LA CLAVE: Función para generar links con idioma
  const getLink = (path: string) => `/${locale}${path}`;

  return (
    <header className={headerClasses}>
      {/* 🔥 NUEVO: Agregamos 'relative' para centrar el logo */}
      <div className="container mx-auto px-4 h-full flex justify-between items-center relative">
        
        {/* ZONA IZQUIERDA */}
        <div className="flex items-center gap-4">
            
            {/* MÓVIL */}
            <div className="lg:hidden">
                {isSubPage ? (
                    <button 
                        onClick={handleBackToDashboard}
                        className={`focus:outline-none p-2 rounded-lg transition-colors block ${iconColorClass} ${
                            isDashboard ? "hover:bg-black/5" : "hover:bg-white/10"
                        }`}
                    >
                        <ArrowLeft size={28} />
                    </button>
                ) : (
                    // ✅ CORREGIDO: Usamos getLink para ir al menú con el idioma correcto
                    <Link 
                        href={getLink('/menu-movil')} 
                        className={`focus:outline-none p-2 -ml-2 rounded-lg transition-colors block ${iconColorClass} ${
                            isDashboard ? "hover:bg-black/5" : "bg-white/5 hover:bg-white/10"
                        }`}
                    >
                        <Menu size={28} />
                    </Link>
                )}
            </div>

            {/* DESKTOP */}
            <div className={`hidden lg:flex items-center flex-shrink-0 ${iconColorClass}`}>
                {isSubPage ? (
                    <button 
                        onClick={handleBackToDashboard} 
                        className={`hover:text-gmc-dorado-principal transition-all duration-300 ml-4 p-2 rounded-full hover:bg-black/5`}
                        title="Volver"
                    >
                        <ArrowLeft size={24} />
                    </button>
                ) : (
                    <Link href={`/${locale}`} className="flex items-center group transition-transform hover:scale-105">
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

        {/* ========================================================================= */}
        {/* 🔥 CORRECCIÓN: LOGO CENTRAL SOLO SI NO ESTAMOS EN DASHBOARD */}
        {/* ========================================================================= */}
        {!isDashboard && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:hidden flex items-center justify-center">
                <Link href={`/${locale}`} className="transition-transform hover:scale-105 active:scale-95">
                    <Image
                        src="/gaspmakercargoproject.png" 
                        alt="Gasp Maker Cargo Logo"
                        width={45}
                        height={45}
                        priority
                        className="object-contain drop-shadow-md"
                    />
                </Link>
            </div>
        )}
        {/* ========================================================================= */}

        {/* ZONA CENTRAL (Links Desktop Corregidos) */}
        {!isSubPage && !isBillingPage && (
            <div className={`hidden lg:flex items-center space-x-4 xl:space-x-6 ${iconColorClass}`}>
            <Link href={getLink('/como-funciona')} className="text-[11px] xl:text-[13px] font-bold hover:text-gmc-dorado-principal transition-all uppercase tracking-[1px] opacity-90">{t('howItWorks')}</Link>
            <Link href={getLink('/servicios')} className="text-[11px] xl:text-[13px] font-bold hover:text-gmc-dorado-principal transition-all uppercase tracking-[1px] opacity-90">{t('services')}</Link>
            <Link href={getLink('/calculadora-costos')} className="text-[11px] xl:text-[13px] font-bold hover:text-gmc-dorado-principal transition-all uppercase tracking-[1px] opacity-90">{t('calculator')}</Link>
            <Link href={getLink('/acerca-de-nosotros')} className="text-[11px] xl:text-[13px] font-bold hover:text-gmc-dorado-principal transition-all uppercase tracking-[1px] opacity-90">{t('aboutUs')}</Link>
            <Link href={getLink('/faq')} className="text-[11px] xl:text-[13px] font-bold hover:text-gmc-dorado-principal transition-all uppercase tracking-[1px] opacity-90">{t('faq')}</Link>
            <Link href={getLink('/testimonios')} className="text-[11px] xl:text-[13px] font-bold hover:text-gmc-dorado-principal transition-all uppercase tracking-[1px] opacity-90">{t('testimonials')}</Link>
            <Link href={getLink('/ubicaciones')} className="text-[11px] xl:text-[13px] font-bold hover:text-gmc-dorado-principal transition-all uppercase tracking-[1px] opacity-90">{t('locations')}</Link>
            </div>
        )}

        {/* ZONA DERECHA */}
        <div className="flex items-center gap-2 md:gap-4">
          
          {!isSubPage && (
            <>
                {/* Idioma */}
                <div className="hidden lg:block relative" ref={langRef}>
                    <button 
                        onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} 
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors border ${iconColorClass} ${
                            isDashboard ? "border-gray-300 hover:bg-black/5" : "bg-white/5 hover:bg-white/10 border-white/10"
                        }`}
                    >
                    <img src={currentLang.flag} alt={currentLang.name} className="w-5 h-auto rounded-sm" />
                    <ChevronDown size={14} className={`transition-transform duration-300 ${isLangMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isLangMenuOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-[#1a1f2e] text-white border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[60]">
                        {languages.map((lang) => (
                        <button key={lang.code} onClick={() => handleLanguageChange(lang.code)} className="flex items-center gap-3 w-full px-4 py-3 text-sm hover:bg-white/5 transition-colors text-left">
                            <img src={lang.flag} alt={lang.name} className="w-5 h-auto rounded-sm" />
                            <span className={locale === lang.code ? 'text-gmc-dorado-principal font-bold' : 'text-white/80'}>{lang.name}</span>
                        </button>
                        ))}
                    </div>
                    )}
                </div>

                {/* Notificaciones */}
                {session && (
                    <div className="flex items-center hover:scale-105 transition-transform">
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
                            {/* ✅ CORREGIDO: Link al menú perfil con idioma */}
                            <Link 
                                href={getLink('/menu-perfil')} 
                                className={`lg:hidden w-9 h-9 rounded-full flex items-center justify-center font-bold shadow-sm border active:scale-95 transition-transform overflow-hidden ${
                                    isDashboard 
                                    ? "bg-[#1a1f2e] text-white border-transparent" 
                                    : "bg-gmc-dorado-principal text-black border-white/10"
                                }`}
                            >
                                {session.user?.image ? (
                                    <img 
                                        src={session.user.image} 
                                        alt="Perfil" 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    session.user?.name?.[0]?.toUpperCase() || <User size={18}/>
                                )}
                            </Link>
                        </>
                    ) : (
                        // ✅ CORREGIDO: Link al login con idioma
                        <Link 
                        href={getLink('/login-cliente')}
                        className="px-3 py-2 lg:px-5 lg:py-2 bg-gmc-dorado-principal text-black font-bold rounded-lg hover:bg-[#e6c200] transition-all text-sm shadow-md flex items-center gap-2"
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

