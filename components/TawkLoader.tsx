"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

export default function TawkLoader() {
  const pathname = usePathname();
  const [cookiesAccepted, setCookiesAccepted] = useState(false);

  // 1. VERIFICACIÓN DE COOKIES (Solo al inicio)
  useEffect(() => {
    const checkConsent = () => {
        if (localStorage.getItem('gmc_cookie_consent') === 'true') {
            setCookiesAccepted(true);
        }
    };
    checkConsent();
    window.addEventListener('cookie_consent_updated', checkConsent);
    return () => window.removeEventListener('cookie_consent_updated', checkConsent);
  }, []);

  // 2. CONTROL DE VISIBILIDAD (Se activa en CADA click o cambio de ruta)
  useEffect(() => {
    // Si Tawk no ha cargado, no hacemos nada aún
    if (typeof window === 'undefined' || !(window as any).Tawk_API) return;

    // DEFINIMOS LA "LISTA BLANCA" (Únicos lugares donde el chat puede vivir)
    const allowedPages = [
        // Landing Page
        '/', 
        '/en', '/es', '/fr', '/pt',
        // FAQ (Para que funcione el botón de Contact Support)
        '/en/faq', '/es/faq', '/fr/faq', '/pt/faq',
        // Contacto (Opcional)
        '/en/contact', '/es/contact', '/fr/contact', '/pt/contact'
    ];

    // Limpiamos la ruta actual
    const currentPath = pathname.endsWith('/') && pathname.length > 1 
        ? pathname.slice(0, -1) 
        : pathname;

    // LÓGICA DE CONTROL
    if (allowedPages.includes(currentPath)) {
        // ✅ ESTAMOS EN LANDING O FAQ -> MOSTRAR
        (window as any).Tawk_API.showWidget();
    } else {
        // ⛔ ESTAMOS EN DASHBOARD O APP -> OCULTAR INMEDIATAMENTE
        (window as any).Tawk_API.hideWidget();
        
        // REFUERZO: A veces Next.js es muy rápido, así que enviamos
        // una segunda orden 500ms después para asegurar que se vaya.
        setTimeout(() => {
            if ((window as any).Tawk_API) {
                (window as any).Tawk_API.hideWidget();
            }
        }, 500);
    }

  }, [pathname, cookiesAccepted]); // 👈 Esto se dispara al cambiar la URL

  if (!cookiesAccepted) return null;

  return (
    <Script 
      id="tawk-widget" 
      strategy="lazyOnload"
      onLoad={() => {
        // CONFIGURACIÓN INICIAL AL CARGAR EL SCRIPT
        if ((window as any).Tawk_API) {
            const path = window.location.pathname;
            const cleanPath = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
            
            // Lista blanca local para la carga inicial
            const safeList = [
                '/', '/en', '/es', '/fr', '/pt',
                '/en/faq', '/es/faq', '/fr/faq', '/pt/faq',
                '/en/contact', '/es/contact', '/fr/contact', '/pt/contact'
            ];

            // Si al cargar resulta que estamos en el Dashboard (ej. recargar página), ocultar directo.
            if (!safeList.includes(cleanPath)) {
                (window as any).Tawk_API.hideWidget();
            }
        }
      }}
    >
      {`
        var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
        (function(){
        var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
        s1.async=true;
        s1.src='https://embed.tawk.to/6760b7db49e2fd8dfef91f45/1if8sscq9';
        s1.charset='UTF-8';
        s1.setAttribute('crossorigin','*');
        s0.parentNode.insertBefore(s1,s0);
        })();
      `}
    </Script>
  );
}