"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

export default function TawkLoader() {
  const pathname = usePathname();
  const [cookiesAccepted, setCookiesAccepted] = useState(false);
  
  // Lista de páginas permitidas (Whitelist)
  const allowedPages = [
      '/', 
      '/en', '/es', '/fr', '/pt',
      '/en/faq', '/es/faq', '/fr/faq', '/pt/faq',
      '/en/contact', '/es/contact', '/fr/contact', '/pt/contact',
      // 🔥 Agregamos las páginas de Términos de Servicio para los 4 idiomas
      '/en/terms-of-service', '/es/terms-of-service', '/fr/terms-of-service', '/pt/terms-of-service'
  ];

  const currentPath = pathname.endsWith('/') && pathname.length > 1 
      ? pathname.slice(0, -1) 
      : pathname;

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

  // 🔥 ELIMINAMOS EL HACK DEL "setInterval" PARA SEGUIR LAS MEJORES PRÁCTICAS DE REACT 🔥

  // 2. LIMPIEZA DE "RESIDUOS" AL NAVEGAR 🧹
  useEffect(() => {
    if (!isAllowedPage && typeof window !== 'undefined' && (window as any).Tawk_API) {
        try { (window as any).Tawk_API.hideWidget(); } catch (e) {}
    } else if (isAllowedPage && cookiesAccepted && typeof window !== 'undefined' && (window as any).Tawk_API) {
        try { (window as any).Tawk_API.showWidget(); } catch (e) {}
    }
  }, [pathname, isAllowedPage, cookiesAccepted]);

  if (!cookiesAccepted || !isAllowedPage) {
      return null;
  }

  return (
    <Script 
      id="tawk-widget" 
      strategy="lazyOnload"
      onLoad={() => {
          if ((window as any).Tawk_API) {
              try { (window as any).Tawk_API.showWidget(); } catch (e) {}
          }
      }}
    >
      {`
        var Tawk_API=Tawk_API||{};
        
        // 🔥 MODO PROFESIONAL: Usamos la API oficial para separar la burbuja del footer
        // y le damos un z-index general sin romper la estructura interna de Tawk.
        Tawk_API.customStyle = {
            visibility: {
                desktop: {
                    yOffset: 50 // Sube 50px solo en computadora
                },
                mobile: {
                    yOffset: 0 // Lo deja normal en celular
                }
            },
            zIndex: 2147483640 // Reemplaza el fix de Android/Windows de forma nativa
        };

        var Tawk_LoadStart=new Date();
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