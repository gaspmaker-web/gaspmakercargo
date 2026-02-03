"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

export default function TawkLoader() {
  const pathname = usePathname();
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // 1. LISTA BLANCA (White List)
    // El chat SOLO existirá en estas páginas exactas.
    // Si no está en esta lista, el chat se destruye (y no estorba).
    const publicPages = [
        // Landing Page (Inicio)
        '/', 
        '/en', '/es', '/fr', '/pt',
        
        // FAQ (¡CRÍTICO! Necesario para que el botón 'Contact Support' funcione)
        '/en/faq', '/es/faq', '/fr/faq', '/pt/faq',
        
        // Contacto
        '/en/contact', '/es/contact', '/fr/contact', '/pt/contact'
    ];

    // Limpieza de ruta (por si acaso hay slash final)
    const currentPath = pathname.endsWith('/') && pathname.length > 1 
        ? pathname.slice(0, -1) 
        : pathname;

    // Verificamos si la página actual está permitida
    const isAllowedPage = publicPages.includes(currentPath);

    if (!isAllowedPage) {
        setShouldLoad(false);
        return; // ⛔ En Dashboard, Perfil, etc., el chat NO carga.
    }

    // 2. COOKIES: Si es página permitida, revisamos si aceptó cookies
    const checkConsent = () => {
        const consent = localStorage.getItem('gmc_cookie_consent');
        if (consent === 'true') {
            setShouldLoad(true);
        }
    };

    checkConsent();
    
    // Escuchar cambios en tiempo real (por si acepta cookies en ese momento)
    window.addEventListener('cookie_consent_updated', checkConsent);
    return () => window.removeEventListener('cookie_consent_updated', checkConsent);
  }, [pathname]);

  // Si no debe cargar, retornamos null (Chat invisible e inexistente)
  if (!shouldLoad) return null;

  return (
    <Script id="tawk-widget" strategy="lazyOnload">
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