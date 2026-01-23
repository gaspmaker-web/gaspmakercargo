"use client";

import Script from 'next/script';

export default function TawkToWidget() {
  return (
    <Script id="tawk-to-widget" strategy="lazyOnload">
      {`
        var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
        (function(){
        var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
        s1.async=true;
        // 👇 TU ID CORRECTO
        s1.src='https://embed.tawk.to/6760b7db49e2fd8dfef91f45/1if8sscq9';
        s1.charset='UTF-8';
        s1.setAttribute('crossorigin','*');
        s0.parentNode.insertBefore(s1,s0);
        })();
      `}
    </Script>
  );
}