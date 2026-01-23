import { auth } from '@/auth'; 
import { redirect } from 'next/navigation'; 
import LoginClient from '@/components/auth/LoginClient'; // 👈 Importa el archivo que creamos en el Paso 1

export default async function LoginPage({ params: { locale } }: { params: { locale: string } }) {
  // 1. Obtenemos la sesión en el servidor
  const session = await auth();

  // 2. 🔥 LÓGICA DE PROTECCIÓN INVERSA 🔥
  // Si EL USUARIO YA EXISTE (está logueado), lo mandamos al Dashboard inmediatamente
  if (session?.user) {
    redirect(`/${locale}/dashboard-cliente`);
  }

  // 3. Si no está logueado, mostramos el formulario (Componente Cliente)
  return <LoginClient />;
}
