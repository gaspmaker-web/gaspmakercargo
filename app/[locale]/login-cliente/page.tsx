import { auth } from '@/auth'; 
import { redirect } from 'next/navigation'; 
import LoginClient from '@/components/auth/LoginClient'; 

// 🛡️ ESCUDO CRÍTICO: Evita que el build falle si la BD no responde
export const dynamic = 'force-dynamic';

export default async function LoginPage({ params: { locale } }: { params: { locale: string } }) {
  // 1. Obtenemos la sesión en el servidor
  const session = await auth();

  // 2. Si EL USUARIO YA EXISTE, lo mandamos al Dashboard
  if (session?.user) {
    redirect(`/${locale}/dashboard-cliente`);
  }

  // 3. Si no está logueado, mostramos el formulario
  return <LoginClient />;
}