import React from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { Inter, Montserrat, Cormorant_Garamond } from 'next/font/google';
import Script from 'next/script'; // 👈 1. IMPORTANTE: Agregamos esto
import '../globals.css';
import Header from '@/components/Header';
import Providers from '@/components/Providers';
import HeaderWrapper from '@/components/HeaderWrapper'; 
import CookieBanner from '@/components/ui/CookieBanner';

// Configuración de fuentes
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' });
const garamond = Cormorant_Garamond({ 
  subsets: ['latin'], 
  weight: ['400', '600', '700'],
  variable: '--font-garamond' 
});

export const metadata = {
  title: 'GaspMakerCargo',
  description: 'Logística global y envíos internacionales.',
};

export default async function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  
  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    messages = {};
  }

  return (
    <html lang={locale}>
      <body className={`${inter.variable} ${montserrat.variable} ${garamond.variable} font-sans bg-gray-50`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            
            {/* 🔴 CAMBIO: Envolvemos el Header con la lógica condicional */}
            <HeaderWrapper>
              <Header /> 
            </HeaderWrapper>
            
            {/* 🔴 CORRECCIÓN: Quitamos pt-[72px] para eliminar el espacio blanco */}
            <main className="min-h-screen"> 
              {children}
            </main>

            <footer className="bg-gmc-gris-oscuro text-white p-8 text-center mt-auto">
              <p className="text-sm opacity-50">© 2026 GaspMakerCargo - Sistema en Reconstrucción</p>
            </footer>

            {/* 🍪 2. AGREGAR EL BANNER AQUÍ (Flotará sobre todo) */}
            <CookieBanner />

            {/* 🔥 3. CHAT TAWK.TO (Inyectado Directamente) 🔥 */}
            <Script id="tawk-widget" strategy="lazyOnload">
              {`
                var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
                
                // NOTA: Forzamos la carga para prueba.
                // Si funciona, luego podemos ocultarlo de nuevo.
                
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

          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}