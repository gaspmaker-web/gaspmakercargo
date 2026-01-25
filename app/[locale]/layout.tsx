import React from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { Inter, Montserrat, Cormorant_Garamond } from 'next/font/google'; // Agregué tus fuentes
import '../globals.css';
import Header from '@/components/Header'; // Importamos tu Header recuperado
import Providers from '@/components/Providers'; // El enchufe de sesión
import { Toaster } from 'sonner'; // Si usas notificaciones (opcional)

// Configuración de fuentes (basado en lo que vi en tu código)
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
  
  // Carga segura de idiomas
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
          <Providers> {/* Envolvemos todo en la Sesión */}
            
            {/* AQUÍ ESTÁ TU HEADER RECUPERADO */}
            <Header /> 
            
            <main className="min-h-screen pt-[72px]"> 
              {/* pt-[72px] es para que el Header fijo no tape el contenido */}
              {children}
            </main>

            {/* Footer temporal simple (luego ponemos el tuyo) */}
            <footer className="bg-gmc-gris-oscuro text-white p-8 text-center mt-auto">
              <p className="text-sm opacity-50">© 2026 GaspMakerCargo - Sistema en Reconstrucción</p>
            </footer>

            <Toaster position="top-right" />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}