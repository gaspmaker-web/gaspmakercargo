import React from 'react';
import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import { auth } from '@/auth'; 
import '../globals.css'; 
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SessionWrapper from '../../components/SessionWrapper'; 
import TawkToWidget from '../../components/TawkToWidget';

// 1. FORZAMOS DINAMISMO: Esto impide que Vercel intente "congelar" esta página como estática.
export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin'] });
const validLocales = ['es', 'en', 'pt', 'fr'];

export const metadata = {
  title: 'GaspMakerCargo',
  description: 'Logística global.',
};

async function loadMessages(locale: string) {
  if (!validLocales.includes(locale)) return {};
  try {
    const msgs = await import(`../../messages/${locale}.json`);
    return msgs?.default ?? msgs;
  } catch (e) {
    return {};
  }
}

export default async function RootLayout({ children, params: { locale } }: { children: ReactNode; params: { locale: string }; }) {
  if (!validLocales.includes(locale)) notFound();

  const messages = await loadMessages(locale);
  
  // 👇 2. EL BLINDAJE "ANTIBALAS"
  // NextAuth v5 beta intenta conectar a la DB aquí. Si falla el build (común en Vercel),
  // capturamos el error para que el despliegue NO se detenga.
  let session;
  try {
    session = await auth();
  } catch (error) {
    console.log("⚠️ Build time auth check bypassed:", error);
    session = null;
  }

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SessionWrapper session={session}>
            <Header />
            <main className="min-h-screen bg-gray-50">
              {children}
            </main>
            <Footer />
            <TawkToWidget />
          </SessionWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}