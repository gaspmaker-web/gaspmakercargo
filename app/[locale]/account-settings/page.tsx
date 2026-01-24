// app/[locale]/account-settings/page.tsx
"use client"; // Agregamos esto para asegurar contexto, aunque usaremos dynamic import

import dynamic from 'next/dynamic';

// 👇 CONFIGURACIÓN CRÍTICA: Forzamos a Next.js a no cachear nada de esta ruta
export const dynamicParams = true; // Permite rutas dinámicas no generadas
export const revalidate = 0;       // No cachear datos

// 👇 IMPORTACIÓN DINÁMICA SIN SSR
// Esto carga el componente AccountContent SOLAMENTE en el navegador del usuario.
// Vercel NO intentará leerlo ni ejecutarlo durante el "npm run build".
const AccountContent = dynamic(() => import('./AccountContent'), { 
  ssr: false,
  loading: () => <div className="p-10 text-center">Cargando...</div>
});

// 👇 Componente Página (Contenedor tonto)
export default function AccountSettingsPage() {
  return <AccountContent />;
}