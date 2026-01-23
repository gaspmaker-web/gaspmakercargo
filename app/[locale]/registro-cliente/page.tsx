import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import RegisterClient from '@/components/auth/RegisterClient';

export default async function RegisterPage({ params: { locale } }: { params: { locale: string } }) {
  // 1. Obtenemos la sesión en el servidor
  const session = await auth();

  // 2. 🔥 LÓGICA DE PROTECCIÓN INVERSA 🔥
  // Si ya tiene cuenta y está logueado, no debe ver el registro.
  if (session?.user) {
    redirect(`/${locale}/dashboard-cliente`);
  }

  // 3. Renderizamos el componente cliente
  return <RegisterClient />;
}










