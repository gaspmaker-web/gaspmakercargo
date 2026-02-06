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

            {/* ✨ NUEVO FOOTER LUXURY (Optimizado para Móvil) */}
            <footer className="bg-gmc-gris-oscuro py-10 px-6 mt-auto border-t-4 border-gmc-dorado-principal">
                <div className="max-w-md mx-auto text-center">
                    
                    {/* 1. NOMBRE DE LA MARCA */}
                    <h2 className="text-2xl font-bold text-white font-garamond mb-3 tracking-wider uppercase">
                        GASP MAKER CARGO
                    </h2>

                    {/* 2. ENLACES LEGALES (Estilo Minimalista) */}
                    <div className="flex justify-center gap-5 mb-6 text-xs font-medium text-gray-400 uppercase tracking-widest font-montserrat">
                        <a href="#" className="hover:text-gmc-dorado-principal transition-colors duration-300">Privacidad</a>
                        <span className="text-gray-600">•</span>
                        <a href="#" className="hover:text-gmc-dorado-principal transition-colors duration-300">Términos</a>
                        <span className="text-gray-600">•</span>
                        <a href="#" className="hover:text-gmc-dorado-principal transition-colors duration-300">Soporte</a>
                    </div>

                    {/* 3. COPYRIGHT Y NOTA */}
                    <div className="space-y-2 font-montserrat">
                        <p className="text-sm text-gray-300">
                            © 2026 Todos los derechos reservados.
                        </p>
                        <p className="text-[10px] text-gmc-dorado-principal/80 font-semibold uppercase tracking-tight bg-black/20 py-1 px-3 rounded-full inline-block">
                            🚀 Sistema en Reconstrucción
                        </p>
                    </div>
                </div>
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