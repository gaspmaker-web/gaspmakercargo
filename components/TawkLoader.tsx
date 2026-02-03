"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

export default function TawkLoader() {
  const pathname = usePathname();
  const [cookiesAccepted, setCookiesAccepted] = useState(false);

  // 1. REVISAR COOKIES (Solo una vez al inicio)
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

  // 2. EL POLICÍA DE TRÁFICO (Se ejecuta en CADA cambio de página) 👮‍♂️
  useEffect(() => {
    // Si no tenemos acceso a la API de Tawk todavía, no podemos hacer nada
    if (typeof window === 'undefined' || !(window as any).Tawk_API) return;

    // DEFINIR LA "LISTA BLANCA" (Solo aquí se permite el chat)
    const allowedPages = [
        // Landing Page (Raíz e idiomas)
        '/', 
        '/en', '/es', '/fr', '/pt',
        // FAQ (Para que funcione el botón de soporte)
        '/en/faq', '/es/faq', '/fr/faq', '/pt/faq',
        // Contacto (Opcional, pero recomendado)
        '/en/contact', '/es/contact', '/fr/contact', '/pt/contact'
    ];

    // Limpiar la ruta actual (quitar slash final si existe)
    const currentPath = pathname.endsWith('/') && pathname.length > 1 
        ? pathname.slice(0, -1) 
        : pathname;

    // LA LÓGICA ESTRICTA
    if (allowedPages.includes(currentPath)) {
        // ✅ ESTÁS EN ZONA PÚBLICA -> MOSTRAR
        // console.log("✅ Zona Pública: Chat Visible");
        (window as any).Tawk_API.showWidget();
    } else {
        // ⛔ ESTÁS EN CUALQUIER OTRA PARTE (App, Dashboard, Perfil, etc) -> OCULTAR
        // console.log("⛔ Zona Privada: Chat Oculto");
        (window as any).Tawk_API.hideWidget();
    }

  }, [pathname, cookiesAccepted]); // Se dispara cada vez que cambias de ruta

  if (!cookiesAccepted) return null;

  return (
    <Script 
      id="tawk-widget" 
      strategy="lazyOnload"
      onLoad={() => {
        // DOBLE SEGURIDAD: Apenas carga el script, ejecutamos la misma revisión
        if ((window as any).Tawk_API) {
            const path = window.location.pathname;
            const cleanPath = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
            
            // Lista blanca local para la carga inicial
            const safeList = [
                '/', '/en', '/es', '/fr', '/pt',
                '/en/faq', '/es/faq', '/fr/faq', '/pt/faq',
                '/en/contact', '/es/contact', '/fr/contact', '/pt/contact'
            ];

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