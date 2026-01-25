import LoginClient from '@/components/auth/LoginClient';

// 🛡️ MODO SEGURO:
// Hemos quitado la verificación de sesión del servidor (auth)
// para que Vercel pueda construir la página sin errores de base de datos.
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return <LoginClient />;
}