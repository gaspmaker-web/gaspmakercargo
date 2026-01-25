import { useTranslations } from 'next-intl';
import Link from 'next/link';

// 🛡️ ESCUDO NUCLEAR: Evita que Vercel intente leer base de datos
export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-5xl font-bold text-yellow-500">
          GaspMakerCargo
        </h1>
        <h2 className="text-2xl font-light text-gray-300">
          Estamos actualizando nuestra plataforma
        </h2>
        <p className="text-gray-400">
          Estamos realizando un mantenimiento programado para mejorar tu experiencia.
          <br />
          El sistema volverá a estar operativo en breve.
        </p>

        <div className="flex justify-center gap-4 pt-8">
          <Link 
            href="/login" 
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-colors"
          >
            Iniciar Sesión
          </Link>
          
          <Link 
            href="/panel-gestion" 
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold transition-colors"
          >
            Ir al Admin (Ya funciona)
          </Link>
        </div>
      </div>
    </div>
  );
}
