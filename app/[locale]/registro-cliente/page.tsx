import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import RegisterClient from '@/components/auth/RegisterClient';

// 🛡️ MANTENEMOS ESTO: Evita que Vercel intente construir la página estáticamente
// y falle si la base de datos no está disponible en el momento del build.
export const dynamic = 'force-dynamic';

export default async function RegisterPage({ params }: { params: { locale: string } }) {
  // 1. Verificamos si hay sesión activa
  const session = await auth();

  // 2. 🛡️ BLOQUEO DE SEGURIDAD:
  // Si el usuario YA está logueado, lo expulsamos al dashboard correspondiente.
  if (session?.user) {
    // Si es admin o warehouse -> Dashboard Admin
    if (session.user.role === 'ADMIN' || session.user.role === 'WAREHOUSE') {
        redirect(`/${params.locale}/dashboard-admin`);
    } 
    // Si es cliente normal -> Dashboard Cliente
    else {
        redirect(`/${params.locale}/dashboard-cliente`);
    }
  }

  // 3. Si NO hay sesión, mostramos el formulario de registro
  return <RegisterClient />;
}