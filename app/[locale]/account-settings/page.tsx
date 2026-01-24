import dynamic from 'next/dynamic';

// 👇 CONFIGURACIÓN: Le dice a Vercel "No intentes construir esto, es dinámico"
export const dynamicParams = true;
export const revalidate = 0; 

// 👇 Importación dinámica SIN SSR
// Esto carga el componente SOLO en el navegador del usuario.
const AccountContent = dynamic(() => import('./AccountContent'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-gray-400">Cargando...</div>
    </div>
  )
});

// 👇 Componente Página simple
export default function AccountSettingsPage({ params }: { params: { locale: string } }) {
  return <AccountContent />;
}