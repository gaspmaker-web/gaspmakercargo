import React from 'react';
import type { Metadata, Viewport } from 'next'; 
import { NextIntlClientProvider } from 'next-intl';
import { Inter, Montserrat, Cormorant_Garamond } from 'next/font/google';
import '../globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer'; 
import Providers from '@/components/Providers';
import HeaderWrapper from '@/components/HeaderWrapper'; 
import CookieBanner from '@/components/ui/CookieBanner';
import TawkLoader from '@/components/TawkLoader'; 
import OneSignalInit from "@/components/client/OneSignalInit"; 

// 🔥 1. IMPORTAMOS LA SESIÓN DE TU USUARIO
import { auth } from "@/auth"; 

// Configuración de fuentes
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' });
const garamond = Cormorant_Garamond({ 
  subsets: ['latin'], 
  weight: ['400', '600', '700'],
  variable: '--font-garamond' 
});

// Viewport: Controla el color de la barra en móviles
export const viewport: Viewport = {
  themeColor: "#000000", 
};

// Metadatos actualizados (Sin avisos de depuración)
export const metadata: Metadata = {
  title: 'Gasp Maker Cargo',
  description: 'Logística global, casillero y envíos internacionales desde Miami.',
  keywords: ["Logística", "Miami", "Envíos", "Gasp Maker", "Aura", "Fulfillment"],
  manifest: "/manifest.json",
  appleWebApp: {
    statusBarStyle: "black-translucent", 
    title: "Gasp Maker",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: 'Gasp Maker Cargo',
    description: 'Tu centro logístico inteligente en Miami.',
    type: 'website',
  }
};

export default async function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  
  // 🔥 2. OBTENEMOS LOS DATOS DEL USUARIO LOGUEADO
  const session = await auth();
  
  // 🔥 EL DETECTIVE: Esto imprimirá los datos en tu terminal de VS Code
  console.log("🔍 DATOS DE SESIÓN:", session?.user);
  
  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    messages = {};
  }

  return (
    <html lang={locale}>
      <body 
        className={`${inter.variable} ${montserrat.variable} ${garamond.variable} font-sans bg-gray-50 flex flex-col min-h-screen`}
        suppressHydrationWarning={true}
      >
        
        {/* 🔥 3. PASAMOS EL ID MÁGICO A ONESIGNAL 🔥 */}
        <OneSignalInit userId={session?.user?.id} />

        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            
            <HeaderWrapper>
              <Header /> 
            </HeaderWrapper>
            
            <main className="flex-grow"> 
              {children}
            </main>

            <Footer />

            <CookieBanner />
            <TawkLoader />

          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}