import React from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { Inter, Montserrat, Cormorant_Garamond } from 'next/font/google';
// import Script from 'next/script'; // 👈 YA NO LO NECESITAMOS AQUÍ (Lo maneja TawkLoader)
import '../globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer'; // 👈 1. IMPORTAMOS EL COMPONENTE FOOTER
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
      <body className={`${inter.variable} ${montserrat.variable} ${garamond.variable} font-sans bg-gray-50 flex flex-col min-h-screen`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            
            <HeaderWrapper>
              <Header /> 
            </HeaderWrapper>
            
            <main className="flex-grow"> 
              {children}
            </main>

            {/* 👈 2. USAMOS EL COMPONENTE FOOTER AQUÍ (Reemplazando el manual) */}
            <Footer />

            <CookieBanner />
            <TawkLoader />

          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}