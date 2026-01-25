import React from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { Inter, Montserrat, Cormorant_Garamond } from 'next/font/google';
import '../globals.css';
import Header from '@/components/Header';
import Providers from '@/components/Providers';

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
            
            {/* Header recuperado */}
            <Header /> 
            
            <main className="min-h-screen pt-[72px]"> 
              {children}
            </main>

            <footer className="bg-gmc-gris-oscuro text-white p-8 text-center mt-auto">
              <p className="text-sm opacity-50">© 2026 GaspMakerCargo - Sistema en Reconstrucción</p>
            </footer>

          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}