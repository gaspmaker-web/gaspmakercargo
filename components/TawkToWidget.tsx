"use client";

import Script from 'next/script';

export default function TawkToWidget() {
  return (
    // Cambiamos a afterInteractive para que cargue más rápido
    <Script id="tawk-to-widget" strategy="afterInteractive">
      {`
        var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();

        // ⚠️ HE QUITADO EL CÓDIGO DE "OCULTAR" TEMPORALMENTE
        // Queremos ver si el chat aparece. 

        (function(){
        var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
        s1.async=true;
        
        // 👇 CAMBIO IMPORTANTE: Usamos 'default' al final. Es el comodín universal.
        s1.src='https://embed.tawk.to/6760b7db49e2fd8dfef91f45/default';
        
        s1.charset='UTF-8';
        s1.setAttribute('crossorigin','*');
        s0.parentNode.insertBefore(s1,s0);
        })();
      `}
    </Script>
  );
}