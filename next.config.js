const createNextIntlPlugin = require('next-intl/plugin');

// Mantenemos tu corrección de la ruta explícita
const withNextIntl = createNextIntlPlugin('./i18n.ts');

// ✅ NUEVO: Configuración del motor de PWA (Aura)
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  sw: process.env.TENANT_SLUG === 'cargoos' ? 'cargoos-sw.js' : 'sw.js',
  workboxOptions: {
    navigateFallbackDenylist: [/^\/api\//],
    runtimeCaching: [
      {
        urlPattern: /^\/api\//,
        handler: 'NetworkOnly',
      },
    ],
  },
});
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Excluye plugins de Capacitor del build de Vercel
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        '@capacitor/camera',
        '@capacitor/core',
        '@aparajita/capacitor-biometric-auth',
      ];
    } else {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@capacitor/camera': false,
        '@capacitor/core': false,
        '@aparajita/capacitor-biometric-auth': false,
      };
    }
    return config;
  },

  // --- CONFIGURACIÓN DE IMÁGENES ---
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '**', 
      },
      {
        protocol: 'https',
        hostname: 'cloudinary.com',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'hwx8ivsyavlc8sq9.public.blob.vercel-storage.com',
        port: '',
        pathname: '**',
      },
    ],
  },
 // -----------------------------------------------
  async redirects() {
    if (process.env.TENANT_SLUG === 'cargoos') {
      return [
        {
          source: '/',
          destination: '/en/cargoos',
          permanent: false,
        },
        {
          source: '/en',
          destination: '/en/cargoos',
          permanent: false,
        },
      ];
    }
    return [];
  },
};
// 🔥 CAMBIO CLAVE: Exportamos envolviendo nextConfig primero en withPWA y luego en withNextIntl
module.exports = withNextIntl(withPWA(nextConfig));