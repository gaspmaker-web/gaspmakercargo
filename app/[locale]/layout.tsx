import React from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { Inter, Montserrat, Cormorant_Garamond } from 'next/font/google';
// import Script from 'next/script'; // 👈 YA NO LO NECESITAMOS AQUÍ (Lo maneja TawkLoader)
import '../globals.css';
import Header from '@/components/Header';
import Providers from '@/components/Providers';
import HeaderWrapper from '@/components/HeaderWrapper'; 
import CookieBanner from '@/components/ui/CookieBanner';
import TawkLoader from '@/components/TawkLoader'; // 👈 1. IMPORTAMOS EL CEREBRO DEL CHAT

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

            {/* 🍪 2. COOKIE BANNER (A la izquierda o abajo en móvil) */}
            <CookieBanner />

            {/* 🔥 3. CHAT INTELIGENTE (Solo carga si aceptan cookies y no es Dashboard) */}
            <TawkLoader />

          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}