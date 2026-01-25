import { Package, Box, Truck } from 'lucide-react';
// import prisma from '@/lib/prisma'; // 👈 APAGAMOS PRISMA TEMPORALMENTE
import BotonDespachar from '@/components/admin/BotonDespachar'; 

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDespachosPage() {
  
  // 👇 DATOS FALSOS PARA PROBAR SI VERCEL LOGRA CONSTRUIR
  // Si esto funciona, el problema es la base de datos.
  const consolidacionesListas: any[] = []; 
  const paquetesSueltosListos: any[] = [];

  /* BLOQUE DE BASE DE DATOS COMENTADO
  try {
      consolidacionesListas = await prisma.consolidatedShipment.findMany({
        where: { status: 'POR_ENVIAR' }, 
        include: { user: true, packages: true },
        orderBy: { updatedAt: 'asc' }
      });

      paquetesSueltosListos = await prisma.package.findMany({
        where: { status: 'POR_ENVIAR', consolidatedShipmentId: null },
        include: { user: true },
        orderBy: { updatedAt: 'asc' }
      });
  } catch (error) {
      console.error("Error DB", error);
  }
  */

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen font-sans text-gray-800">
      <div className="max-w-6xl mx-auto">
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
            <p className="font-bold text-yellow-700">MODO PRUEBA DE BUILD</p>
            <p className="text-sm text-yellow-600">Si ves esto, el Build funcionó y el error está en la conexión a la Base de Datos.</p>
        </div>

        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <Truck className="text-blue-600"/> Centro de Despachos
                </h1>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border text-sm font-bold text-gray-600">
                Total Pendiente: {consolidacionesListas.length + paquetesSueltosListos.length}
            </div>
        </div>

        <div className="space-y-8">
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <div className="bg-green-50 p-4 rounded-full mb-4">
                    <Truck size={40} className="text-green-500"/>
                </div>
                <h3 className="text-xl font-bold text-gray-800">¡Todo despachado!</h3>
                <p className="text-gray-400 mt-2">No hay envíos pendientes de tracking (Modo Prueba).</p>
            </div>
        </div>
      </div>
    </div>
  );
}