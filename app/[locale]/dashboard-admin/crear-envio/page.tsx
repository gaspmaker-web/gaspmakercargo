import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import CreatePackageForm from '@/components/admin/CreatePackageForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// 👇 ESTA LÍNEA ARREGLA EL BUILD
export const dynamic = 'force-dynamic';

export default async function CreateShipmentPage(props: any) {
  // 1. Manejo seguro de params (Next.js 15 friendly)
  const params = await props.params;
  const locale = params?.locale || 'es';

  const session = await auth();

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE')) {
    redirect(`/${locale}/login-cliente`);
  }

  return (
    // CAMBIO: 'p-2' en móvil para ganar espacio, 'p-8' en PC
    <div className="min-h-screen bg-gray-50 p-2 sm:p-6 lg:p-8 font-montserrat">
      <div className="max-w-4xl mx-auto">
        
        <div className="mb-4 sm:mb-6 px-2">
            <Link 
                href={`/${locale}/dashboard-admin`}
                className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-gmc-dorado-principal transition-colors active:scale-95"
            >
                <ArrowLeft size={20} className="mr-2" />
                Volver
            </Link>
        </div>

        {/* Header optimizado para móvil */}
        <div className="mb-6 px-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gmc-gris-oscuro mb-1 font-garamond">
            Recepción Warehouse
          </h1>
          <p className="text-sm text-gray-500 hidden sm:block">
            Ingresa los detalles del paquete físico recibido. Asegúrate de subir la foto.
          </p>
          <p className="text-xs text-gray-400 sm:hidden">
            Usa la cámara para escanear tracking y tomar foto.
          </p>
        </div>

        {/* Pasamos el locale por si el formulario necesita redirigir */}
        <CreatePackageForm locale={locale} />
        
      </div>
    </div>
  );
}