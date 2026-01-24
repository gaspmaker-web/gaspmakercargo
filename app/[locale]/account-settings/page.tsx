import dynamicImport from 'next/dynamic';

// 🛑 ESTA ES LA LÍNEA MÁGICA 🛑
// Obliga a Next.js a saltarse la generación estática por completo para esta página.
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Importamos el contenido desactivando el SSR (Server Side Rendering)
const AccountContent = dynamicImport(() => import('./AccountContent'), { 
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="text-gray-500 font-medium animate-pulse">
        Cargando configuración...
      </div>
    </div>
  )
});

export default function AccountSettingsPage({ params }: { params: { locale: string } }) {
  return <AccountContent />;
}