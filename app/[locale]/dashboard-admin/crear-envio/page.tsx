import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import CreatePackageForm from '@/components/admin/CreatePackageForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// 👇 ESTA LÍNEA ES IMPORTANTE PARA EL BUILD
export const dynamic = 'force-dynamic';

export default async function CreateShipmentPage(props: any) {
  // Manejo de params compatible con Next.js 15
  const params = await props.params;
  const locale = params?.locale || 'es';

  const session = await auth();

  // Validación de Rol (Admin o Bodega)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE')) {
    redirect(`/${locale}/login-cliente`);
  }

  return (
    // 'p-2' en móvil para ganar espacio
    <div className="min-h-screen bg-gray-50 p-2 sm:p-6 lg:p-8 font-montserrat">
      <div className="max-w-3xl mx-auto">

        {/* Título Header */}
        <div className="mb-6 px-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gmc-gris-oscuro mb-1 font-garamond">
            Package Reception
          </h1>
          <p className="text-sm text-gray-500 hidden sm:block">
            Enter the details of the physical package received.
          </p>
        </div>

        {/* 👇 CORRECCIÓN AQUÍ: Ya no pasamos props porque el nuevo Form no los pide */}
        <CreatePackageForm />
        
      </div>
    </div>
  );
}