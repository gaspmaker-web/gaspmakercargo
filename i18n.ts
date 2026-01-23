import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

const locales = ['es', 'en', 'fr', 'pt'];

export default getRequestConfig(async ({ requestLocale }) => {
  // 1. Obtenemos el locale de la promesa (API v4)
  let locale = await requestLocale;

  // 2. Validamos y aplicamos fallback si es undefined
  if (!locale || !locales.includes(locale)) {
    locale = 'es';
  }

  try {
    return {
      locale, // <--- 🚨 ¡ESTA LÍNEA ES LA QUE FALTABA! 🚨
      messages: (await import(`./messages/${locale}.json`)).default
    };
  } catch (error) {
    console.error(`❌ Error cargando mensajes para: ${locale}`, error);
    notFound();
  }
});