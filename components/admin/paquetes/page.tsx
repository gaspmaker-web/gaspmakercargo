import prisma from '@/lib/prisma';
import Link from 'next/link';
import { Package, ArrowRight, AlertCircle } from 'lucide-react';

export default async function AdminPackagesPage() {
  // Buscamos paquetes que sean PRE_ALERTA (lo que envió el cliente)
  // O RECIBIDO_MIAMI (lo que ya tenemos)
  const packages = await prisma.package.findMany({
    where: {
      status: { in: ['PRE_ALERTA', 'RECIBIDO_MIAMI'] }
    },
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Gestión de Paquetes</h1>
      
      <div className="grid gap-4">
        {packages.map(pkg => (
          <Link key={pkg.id} href={`/dashboard-admin/paquetes/${pkg.id}`}>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-blue-500 cursor-pointer flex justify-between items-center transition-all">
              
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${pkg.status === 'PRE_ALERTA' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                  <Package size={24} />
                </div>
                <div>
                  <p className="font-bold text-lg text-gray-800">
                    {pkg.description} 
                    <span className="text-sm font-normal text-gray-500 ml-2">({pkg.carrierTrackingNumber})</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Cliente: {pkg.user.name} ({pkg.user.suiteNo})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {pkg.status === 'PRE_ALERTA' && (
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
                    <AlertCircle size={12}/> Requiere Recepción
                  </span>
                )}
                {pkg.status === 'RECIBIDO_MIAMI' && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
                    En Bodega
                  </span>
                )}
                <ArrowRight className="text-gray-300" />
              </div>

            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}