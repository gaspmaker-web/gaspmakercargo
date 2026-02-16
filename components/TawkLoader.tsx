"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

export default function TawkLoader() {
  const pathname = usePathname();
  const [cookiesAccepted, setCookiesAccepted] = useState(false);
  
  // Lista de páginas permitidas (Whitelist) - TAL CUAL TU CÓDIGO
  const allowedPages = [
      '/', 
      '/en', '/es', '/fr', '/pt',
      '/en/faq', '/es/faq', '/fr/faq', '/pt/faq',
      '/en/contact', '/es/contact', '/fr/contact', '/pt/contact'
  ];

  const currentPath = pathname.endsWith('/') && pathname.length > 1 
      ? pathname.slice(0, -1) 
      : pathname;

  // Calculamos si debemos mostrarlo ANTES de renderizar nada
  const isAllowedPage = allowedPages.includes(currentPath);

  // 1. CHEQUEO DE COOKIES
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

  // 2. 🔥 FIX PARA ANDROID Y WINDOWS (Z-INDEX)
  // ESTE ES EL ÚNICO BLOQUE NUEVO NECESARIO PARA QUE SE VEA BIEN
  useEffect(() => {
    // Solo ejecutamos si es página permitida y hay cookies aceptadas
    if (!isAllowedPage || !cookiesAccepted) return;

    const interval = setInterval(() => {
        const tawkIframes = document.querySelectorAll('iframe[title*="chat"]');
        tawkIframes.forEach((iframe) => {
            if (iframe) {
                // @ts-ignore
                iframe.style.setProperty("z-index", "2147483647", "important");
                // @ts-ignore
                iframe.style.setProperty("position", "fixed", "important");
            }
        });
    }, 2000);

    return () => clearInterval(interval);
  }, [isAllowedPage, cookiesAccepted]);

  // 3. LIMPIEZA DE "RESIDUOS" AL NAVEGAR 🧹
  useEffect(() => {
    if (!isAllowedPage && typeof window !== 'undefined' && (window as any).Tawk_API) {
        // Si entramos a zona prohibida, forzamos ocultar inmediatamente
        try { (window as any).Tawk_API.hideWidget(); } catch (e) {}
    } else if (isAllowedPage && cookiesAccepted && typeof window !== 'undefined' && (window as any).Tawk_API) {
        // Si volvimos a zona permitida, asegurar que se vea
        try { (window as any).Tawk_API.showWidget(); } catch (e) {}
    }
  }, [pathname, isAllowedPage, cookiesAccepted]);

  // 🛑 REGLA DE ORO: Si no hay cookies O no es página permitida,
  // devolvemos NULL. Así el script NO se carga al refrescar la página.
  if (!cookiesAccepted || !isAllowedPage) {
      return null;
  }

  return (
    <Script 
      id="tawk-widget" 
      strategy="lazyOnload"
      onLoad={() => {
          // Doble seguridad al terminar de cargar
          if ((window as any).Tawk_API) {
              try { (window as any).Tawk_API.showWidget(); } catch (e) {}
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