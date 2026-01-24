// app/[locale]/account-settings/page.tsx
import dynamic from 'next/dynamic';

// 👇 ESTA ES LA CLAVE DEL ARREGLO:
// Le decimos explícitamente a Next.js qué idiomas existen para que no falle al intentar adivinar.
export async function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'es' },
    { locale: 'fr' },
    { locale: 'pt' }
  ];
}

// Configuración para evitar cacheo agresivo
export const revalidate = 0;

// Importación dinámica SIN SSR (Server Side Rendering)
// Esto aísla la lógica del cliente para que no rompa el build del servidor.
const AccountContent = dynamic(() => import('./AccountContent'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-gray-500 font-medium">Cargando ajustes...</div>
    </div>
  )
});

// Componente de Página
export default function AccountSettingsPage({ params }: { params: { locale: string } }) {
  // Simplemente renderizamos el componente cliente
  return <AccountContent />;
}