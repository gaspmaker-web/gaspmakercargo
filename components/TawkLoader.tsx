"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

export default function TawkLoader() {
  const pathname = usePathname();
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // 1. LÓGICA DE DASHBOARD: Si la URL contiene "dashboard" o "admin", NO cargar.
    if (pathname.includes('/dashboard') || pathname.includes('/admin')) {
        setShouldLoad(false);
        return;
    }

    // 2. LÓGICA DE COOKIES: Solo cargar si el usuario dio permiso
    const checkConsent = () => {
        const consent = localStorage.getItem('gmc_cookie_consent');
        if (consent === 'true') {
            setShouldLoad(true);
        }
    };

    // Revisamos al cargar la página
    checkConsent();

    // Escuchamos el evento que creamos en el paso 1 (para que aparezca al instante sin recargar)
    window.addEventListener('cookie_consent_updated', checkConsent);

    return () => window.removeEventListener('cookie_consent_updated', checkConsent);
  }, [pathname]);

  // Si no cumple las reglas, no renderiza nada (Chat invisible)
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