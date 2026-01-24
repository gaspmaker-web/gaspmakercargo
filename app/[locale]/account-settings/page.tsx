// app/[locale]/account-settings/page.tsx

// 👇 1. Importamos la función para carga dinámica con un ALIAS para no chocar nombres
import dynamicLoader from 'next/dynamic';

// 👇 2. Importamos el componente de contenido PERO desactivando el SSR (Server Side Rendering)
// Esto es la clave: evita que el Build intente ejecutar el código y falle.
const AccountContent = dynamicLoader(() => import('./AccountContent'), { 
  ssr: false,
  loading: () => <div className="p-10 text-center">Cargando ajustes...</div>
});

// 👇 3. Configuración estándar de página
export const dynamic = "force-dynamic";

interface Props {
  params: { locale: string };
}

export default function AccountSettingsPage({ params }: Props) {
  // Ahora renderizamos el componente "seguro" que solo carga en el cliente
  return <AccountContent />;
}