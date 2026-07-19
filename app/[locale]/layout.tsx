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
import { getTenant, getTenantCSSVars } from '@/lib/tenant';

// 🔥 QUITA LA IMPORTACIÓN DE ONESIGNAL DE AQUÍ 🔥
import { auth } from "@/auth"; 

// Configuración de fuentes
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' });
const garamond = Cormorant_Garamond({ 
  subsets: ['latin'], 
  weight: ['400', '600', '700'],
  variable: '--font-garamond' 
});

export const viewport: Viewport = {
  themeColor: "#000000", 
};

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
  
  const session = await auth();
  const tenant = await getTenant();
  const tenantStyles = getTenantCSSVars(tenant);
  
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
  style={tenantStyles}
>
        
        
        {/* 🔥 QUITA LA ETIQUETA DE ONESIGNAL DE AQUÍ 🔥 */}

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