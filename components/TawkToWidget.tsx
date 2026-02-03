"use client";

import Script from 'next/script';
import { usePathname } from 'next/navigation';

export default function TawkToWidget() {
  const pathname = usePathname();

  return (
    <Script id="tawk-to-widget" strategy="lazyOnload">
      {`
        var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();

        // 1. CUANDO EL CHAT CARGA
        Tawk_API.onLoad = function(){
            // Verificamos si el usuario ya lo cerró antes
            var isHidden = localStorage.getItem('gmc_chat_hidden');
            
            // Si está marcado como oculto, lo escondemos inmediatamente
            if (isHidden === 'true') {
                Tawk_API.hideWidget();
            }
        };

        // 2. CUANDO EL USUARIO MINIMIZA (CIERRA) EL CHAT
        Tawk_API.onChatMinimized = function(){
            // Lo ocultamos visualmente por completo
            Tawk_API.hideWidget();
            
            // Guardamos en la memoria que el usuario NO quiere verlo
            localStorage.setItem('gmc_chat_hidden', 'true');
        };

        // 3. (Opcional) Si queremos que en FAQ siempre aparezca aunque lo haya borrado
        // Como usamos el botón manual en FAQ, ese botón forzará el 'showWidget', así que no necesitamos lógica extra aquí.

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