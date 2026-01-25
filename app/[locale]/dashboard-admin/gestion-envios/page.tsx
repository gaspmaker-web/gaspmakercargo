import dynamicImport from 'next/dynamic';

// 🛡️ EL ESCUDO: Fuerza renderizado dinámico y sin caché
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Importamos el componente cliente SIN SSR
const ControlEnviosClient = dynamicImport(() => import('./ControlEnviosClient'), { 
  ssr: false, // 👈 Esto es clave: Vercel NO ejecutará el código durante el build
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
        <p className="mt-2 text-gray-500">Iniciando sistema de control...</p>
      </div>
    </div>
  )
});

export default function Page() {
  return <ControlEnviosClient />;
}