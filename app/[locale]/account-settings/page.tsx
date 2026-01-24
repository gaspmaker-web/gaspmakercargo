import { useTranslations } from 'next-intl'; // Opcional, si usas traducciones

// 👇 ESTA LÍNEA ES LA SOLUCIÓN.
// Obliga a Vercel a saltarse esta página en el Build y generarla solo cuando el usuario entra.
export const dynamic = 'force-dynamic';

export default function AccountSettingsPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          Configuración de Cuenta
        </h1>
        <p className="text-gray-600">
          Esta sección es privada y se generará bajo demanda.
        </p>
      </div>
    </div>
  );
}