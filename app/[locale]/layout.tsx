import React from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { Inter } from 'next/font/google';
import '../globals.css';

// ⚠️ MODO SEGURO EXTREMO
// Sin Header, sin Footer, sin Auth. Solo muestra el contenido.

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'GaspMakerCargo',
  description: 'Logística global.',
};

export default async function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  
  // Carga de mensajes ultra-segura
  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    messages = {};
  }

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
            {/* HEMOS QUITADO HEADER, FOOTER Y SESSIONWRAPPER */}
            <main className="min-h-screen bg-white">
              {children}
            </main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}