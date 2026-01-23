import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import CreatePackageForm from '@/components/admin/CreatePackageForm';
import Link from 'next/link'; // Importamos Link
import { ArrowLeft } from 'lucide-react'; // Importamos el icono

export default async function CreateShipmentPage({ params }: { params: { locale: string } }) {
  const session = await auth();

  // Seguridad: Solo Admin o Warehouse
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE')) {
    redirect('/login-cliente');
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 font-montserrat">
      <div className="max-w-4xl mx-auto">
        
        {/* --- BOTÓN DE VOLVER AL PANEL (NUEVO) --- */}
        <div className="mb-6">
            <Link 
                href={`/${params.locale}/dashboard-admin`}
                className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-gmc-dorado-principal transition-colors"
            >
                <ArrowLeft size={20} className="mr-2" />
                Volver al Panel
            </Link>
        </div>
        {/* ---------------------------------------- */}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gmc-gris-oscuro mb-2 font-garamond">
            Registrar Nuevo Paquete
          </h1>
          <p className="text-gray-500">
            Ingresa los detalles del paquete físico recibido en el almacén de Miami.
            Asegúrate de subir la foto para el cliente.
          </p>
        </div>

        <CreatePackageForm />
        
      </div>
    </div>
  );
}
