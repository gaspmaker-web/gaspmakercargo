const createNextIntlPlugin = require('next-intl/plugin');

// Mantenemos tu corrección de la ruta explícita
const withNextIntl = createNextIntlPlugin('./i18n.ts');

// ✅ NUEVO: Configuración del motor de PWA (Aura)
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // --- CONFIGURACIÓN DE IMÁGENES ---
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // ✅ CRÍTICO: Para que se vean tus avatares de Cloudinary
        port: '',
        pathname: '**', 
      },
      {
        protocol: 'https',
        hostname: 'cloudinary.com', // Por seguridad agregamos el dominio base
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com', // ✅ AGREGADO: Para permitir las banderas de idiomas si usas <Image />
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'hwx8ivsyavlc8sq9.public.blob.vercel-storage.com', // 🔥 AGREGADO: Para las fotos de los sobres en Vercel Blob
        port: '',
        pathname: '**',
      },
    ],
  },
  // -----------------------------------------------
};

// 🔥 CAMBIO CLAVE: Exportamos envolviendo nextConfig primero en withPWA y luego en withNextIntl
module.exports = withNextIntl(withPWA(nextConfig));