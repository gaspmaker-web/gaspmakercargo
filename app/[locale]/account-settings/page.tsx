import dynamic from 'next/dynamic';

// 1. ESTAS LÍNEAS SON VITALES:
// Le dicen a Next.js: "No intentes generar esto estáticamente, hazlo dinámico siempre"
export const dynamicParams = true;
export const revalidate = 0; 

// 2. Importamos el contenido con "ssr: false"
// Esto evita que el servidor intente ejecutar la lógica del usuario durante el build
const AccountContent = dynamic(() => import('./AccountContent'), { 
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="text-gray-500 font-medium">Cargando configuración...</div>
    </div>
  )
});

// 3. Componente Padre "Tonto"
// Este componente no hace NADA de lógica, solo muestra el contenido dinámico.
// Así el Build de Vercel pasa sin errores.
export default function AccountSettingsPage({ params }: { params: { locale: string } }) {
  return <AccountContent />;
}