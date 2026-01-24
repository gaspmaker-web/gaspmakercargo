import AccountContent from "./AccountContent";

// 👇 1. Mantenemos esto: Es VITAL para que Vercel no intente "congelar" la página
export const dynamic = "force-dynamic";

// 👇 2. Eliminamos imports raros. Solo definimos los tipos básicos.
interface Props {
  params: { locale: string };
}

// 👇 3. Componente Servidor Limpio
export default function AccountSettingsPage({ params }: Props) {
  // Simplemente pasamos el control al componente Cliente.
  // Al tener 'force-dynamic' arriba, Next.js sabe que no debe generar esto estáticamente.
  return <AccountContent />;
}

