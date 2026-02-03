"use client";

import Script from 'next/script';

export default function TawkToWidget() {
  // Leemos la variable que acabas de configurar
  const tawkSrc = process.env.NEXT_PUBLIC_TAWK_SRC;

  if (!tawkSrc) {
    // Si olvidaste poner la variable, esto te avisará en la consola del navegador
    console.warn("⚠️ Falta la variable NEXT_PUBLIC_TAWK_SRC en Vercel/Env");
    return null;
  }

  return (
    <Script id="tawk-to-widget" strategy="lazyOnload">
      {`
        var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();

        // 1. EL CHAT NACE OCULTO (Modo Profesional)
        Tawk_API.onLoad = function(){
            var isHidden = localStorage.getItem('gmc_chat_hidden');
            if (isHidden === 'true') {
                Tawk_API.hideWidget();
            }
        };

        // 2. SI EL CLIENTE LO CIERRA, SE QUEDA OCULTO
        Tawk_API.onChatMinimized = function(){
            Tawk_API.hideWidget();
            localStorage.setItem('gmc_chat_hidden', 'true');
        };

        (function(){
        var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
        s1.async=true;
        s1.src='${tawkSrc}'; // 👈 Aquí se inyecta tu URL segura
        s1.charset='UTF-8';
        s1.setAttribute('crossorigin','*');
        s0.parentNode.insertBefore(s1,s0);
        })();
      `}
    </Script>
  );
}