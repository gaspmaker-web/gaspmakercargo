import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import RegisterClient from '@/components/auth/RegisterClient';

// 🛡️ MANTENEMOS ESTO: Evita que Vercel intente construir la página estáticamente
// y falle si la base de datos no está disponible en el momento del build.
export const dynamic = 'force-dynamic';

export default async function RegisterPage({ 
  params,
  searchParams // 🔥 1. Agregamos esto para poder leer la URL (?ref=...)
}: { 
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // 1. Verificamos si hay sesión activa
  const session = await auth();

  // 2. 🛡️ BLOQUEO DE SEGURIDAD:
  if (session?.user) {
    if (session.user.role === 'ADMIN' || session.user.role === 'WAREHOUSE') {
        redirect(`/${params.locale}/dashboard-admin`);
    } 
    else if (session.user.role === 'DRIVER') {
        redirect(`/${params.locale}/dashboard-driver`);
    }
    else {
        redirect(`/${params.locale}/dashboard-cliente`);
    }
  }

  // 🔥 3. CAPTURAMOS EL CÓDIGO DE REFERIDO (Si existe en la URL)
  // Si la URL es /registro-cliente?ref=GERARDO123, esto guarda "GERARDO123"
  const referralCode = typeof searchParams.ref === 'string' ? searchParams.ref : undefined;

  // 🔥 4. Le pasamos el código al componente visual para que lo guarde en secreto
  return <RegisterClient initialReferralCode={referralCode} />;
}