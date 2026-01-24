// app/[locale]/account-settings/page.tsx
import dynamic from 'next/dynamic';

// 👇 DEFENSA 1: Configuraciones para evitar cache estático
export const dynamicParams = true;
export const revalidate = 0;

// 👇 DEFENSA 2: "El Truco Mágico"
// Esta función le dice a Next.js: "No intentes generar rutas estáticas para esta página ahora, hazlo bajo demanda".
// Esto suele arreglar el error de "Failed to collect page data" en rutas [locale].
export function generateStaticParams() {
  return [];
}

// 👇 DEFENSA 3: Importación sin SSR (Server Side Rendering)
// Cargamos el contenido SOLO en el navegador, nunca en el servidor de build.
const AccountContent = dynamic(() => import('./AccountContent'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-gmc-dorado-principal font-bold text-lg animate-pulse">
        Cargando ajustes...
      </div>
    </div>
  )
});

// Definimos los tipos para los parámetros
interface Props {
  params: { locale: string };
}

export default function AccountSettingsPage({ params }: Props) {
  return <AccountContent />;
}