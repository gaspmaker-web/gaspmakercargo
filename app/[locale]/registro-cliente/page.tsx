import RegisterClient from '@/components/auth/RegisterClient';

// 🛡️ MODO SEGURO:
// Hemos quitado la verificación de sesión del servidor (auth)
// para que Vercel pueda construir la página sin errores de base de datos.
export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  return <RegisterClient />;
}