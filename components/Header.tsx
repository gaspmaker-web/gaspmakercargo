"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation'; 
import Link from 'next/link';
import { Menu, ArrowLeft, ChevronDown, User } from 'lucide-react'; 
import ProfileButton from "@/components/ProfileButton";
import { useSession } from "next-auth/react";
import { useTranslations } from 'next-intl';
import NotificationBell from "@/components/ui/NotificationBell";

interface HeaderProps {
  backButtonUrl?: string; 
}

export default function Header({ backButtonUrl }: HeaderProps) {
  const t = useTranslations('Navigation'); 
  const pathname = usePathname();
  const router = useRouter();
  
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession(); 

  // Detectar si estamos en alguna sección del Dashboard
  const isDashboard = pathname.includes('/dashboard-cliente') || pathname.includes('/menu') || pathname.includes('/account-settings');

  // Detectar página de Facturas específicamente
  const isBillingPage = pathname.includes('/pagar-facturas');

  // Lista de sub-páginas que muestran Flecha
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

  // Idiomas
  const languages = [
    { code: 'es', name: 'Español', flag: 'https://flagcdn.com/w20/es.png' },
    { code: 'en', name: 'English', flag: 'https://flagcdn.com/w20/us.png' },
    { code: 'fr', name: 'Français', flag: 'https://flagcdn.com/w20/fr.png' },
    { code: 'pt', name: 'Português', flag: 'https://flagcdn.com/w20/br.png' },
  ];
  const segments = pathname.split('/');
  const currentLocale = segments[1] || 'es';
  const currentLang = languages.find(l => l.code === currentLocale) || languages[0];

  const handleLanguageChange = (code: string) => {
    const newSegments = [...segments];
    newSegments[1] = code;
    const newPath = newSegments.join('/') || `/${code}`;
    router.push(newPath); 
    setIsLangMenuOpen(false);
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
        
        {/* =========================================================
            ZONA IZQUIERDA (HAMBURGUESA / BACK)
           ========================================================= */}
        <div className="flex items-center gap-4">
            
            {/* MÓVIL: Botones optimizados para tacto (min 48px) */}
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

            {/* DESKTOP */}
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

        {/* =========================================================
            ZONA CENTRAL (Navegación Desktop)
           ========================================================= */}
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

        {/* =========================================================
            ZONA DERECHA (Idiomas, Notif, Perfil)
           ========================================================= */}
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
                    <img src={currentLang.flag} alt={currentLang.name} className="w-5 h-auto rounded-sm" />
                    <ChevronDown size={14} className={`transition-transform duration-300 ${isLangMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isLangMenuOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-[#1a1f2e] text-white border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[60]">
                        {languages.map((lang) => (
                        <button 
                            key={lang.code} 
                            onClick={() => handleLanguageChange(lang.code)} 
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm hover:bg-white/5 transition-colors text-left"
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
                            
                            {/* 🔥 ICONO PERFIL MÓVIL OPTIMIZADO 🔥 */}
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

