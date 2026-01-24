// app/[locale]/account-settings/page.tsx
import dynamic from 'next/dynamic';

// 👇 1. Forzamos a que esta ruta sea dinámica (se genera al momento, no en el build)
export const dynamicParams = true;
export const revalidate = 0;

// 👇 2. Importamos el contenido del cliente SIN SSR (Server Side Rendering)
// Esto aísla completamente la lógica de usuario (sesión, traducciones) del proceso de Build.
const AccountContent = dynamic(() => import('./AccountContent'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-gray-500">Cargando ajustes...</div>
    </div>
  )
});

// 👇 3. Definimos la página como un Server Component simple
export default function AccountSettingsPage({ params }: { params: { locale: string } }) {
  return <AccountContent />;
}