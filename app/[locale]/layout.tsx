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
import Script from 'next/script';

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
const tenantSlug = tenant?.slug || process.env.TENANT_SLUG || 'gaspmaker';

  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    messages = {};
  }

  return (
    <html lang={locale} className="overflow-x-hidden">
     <body 
  className={`${inter.variable} ${montserrat.variable} ${garamond.variable} font-sans bg-gray-50 flex flex-col min-h-screen overflow-x-hidden`}
  suppressHydrationWarning={true}
  style={tenantStyles}
>
        
        
{/* 🔥 META PIXEL 🔥 */}
<Script
  id="facebook-pixel"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '1372892784992511');
      fbq('track', 'PageView');
    `,
  }}
/>

<NextIntlClientProvider locale={locale} messages={messages}>
  <Providers>
    
  <HeaderWrapper tenantSlug={tenantSlug}>
  <Header tenantSlug={tenantSlug} /> 
</HeaderWrapper>
    
    <main className="flex-grow"> 
      {children}
    </main>

    <Footer tenantSlug={tenantSlug} />

    {tenantSlug !== 'cargoos' && <CookieBanner />}
    <TawkLoader />

  </Providers>
</NextIntlClientProvider>
      </body>
    </html>
  );
}