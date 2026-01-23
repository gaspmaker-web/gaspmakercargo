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
// 👇 IMPORTAR EL WIDGET DE CHAT
import TawkToWidget from '../../components/TawkToWidget';

const inter = Inter({ subsets: ['latin'] });
const validLocales = ['es', 'en', 'pt', 'fr'];

export const metadata = {
  title: 'GaspMakerCargo',
  description: 'Logística global.',
};

async function loadMessages(locale: string) {
  // Validamos que el idioma sea uno de los permitidos
  if (!validLocales.includes(locale)) return {};
  
  try {
    // Importamos dinámicamente el archivo JSON correspondiente
    const msgs = await import(`../../messages/${locale}.json`);
    // Retornamos el contenido (default para módulos ES6 o el objeto directo)
    return msgs?.default ?? msgs;
  } catch (e) {
    // Si falla (ej: archivo no existe), retornamos objeto vacío para evitar crash
    console.error(`Error loading messages for locale: ${locale}`, e);
    return {};
  }
}

export default async function RootLayout({ children, params: { locale } }: { children: ReactNode; params: { locale: string }; }) {
  // Si el idioma en la URL no es válido, mostramos 404
  if (!validLocales.includes(locale)) notFound();

  // Cargamos las traducciones
  const messages = await loadMessages(locale);
  
  // Cargamos la sesión de usuario
  const session = await auth(); 

  return (
    <html lang={locale}>
      <body className={inter.className}>
        {/* Pasamos 'messages' al provider para que los componentes "use client" puedan usar useTranslations */}
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SessionWrapper session={session}>
            <Header />
            <main className="min-h-screen bg-gray-50">
              {children}
            </main>
            <Footer />
            
            {/* 👇 AGREGAMOS EL CHAT AQUÍ AL FINAL */}
            <TawkToWidget />
            
          </SessionWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}