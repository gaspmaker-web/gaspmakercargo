import prisma from '@/lib/prisma';
import { Package, Box, Truck } from 'lucide-react';
import BotonDespachar from '@/components/admin/BotonDespachar'; 

// 👇 ESCUDO NUCLEAR: Configuración para evitar caché
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function AdminDespachosPage() {
  
  let consolidacionesListas = [];
  let paquetesSueltosListos = [];

  try {
      // 1. BUSCAR CONSOLIDACIONES (Con protección de errores)
      consolidacionesListas = await prisma.consolidatedShipment.findMany({
        where: { status: 'POR_ENVIAR' }, 
        include: {
          user: true,
          packages: true 
        },
        orderBy: { updatedAt: 'asc' }
      });

      // 2. BUSCAR PAQUETES INDIVIDUALES (Con protección de errores)
      paquetesSueltosListos = await prisma.package.findMany({
        where: { 
            status: 'POR_ENVIAR',
            consolidatedShipmentId: null 
        },
        include: { user: true },
        orderBy: { updatedAt: 'asc' }
      });
  } catch (error) {
      console.error("Error obteniendo despachos:", error);
      // Si falla la BD, continuamos con arrays vacíos para que el Build NO se rompa
  }

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen font-sans text-gray-800">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <Truck className="text-blue-600"/> Centro de Despachos
                </h1>
                <p className="text-gray-500 mt-1">
                    Gestiona los envíos que ya han sido pagados y necesitan Tracking Number.
                </p>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border text-sm font-bold text-gray-600">
                Total Pendiente: {consolidacionesListas.length + paquetesSueltosListos.length}
            </div>
        </div>

        <div className="space-y-8">
            
            {/* CONSOLIDACIONES */}
            {consolidacionesListas.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-800 border-b pb-2">
                        <Box className="text-blue-600"/> Consolidaciones ({consolidacionesListas.length})
                    </h2>
                    <div className="grid gap-4">
                        {consolidacionesListas.map((envio) => (
                            <div key={envio.id} className="group hover:bg-blue-50/50 transition-colors p-4 rounded-xl border border-gray-200 hover:border-blue-300 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Consolidado</span>
                                        <span className="text-xs text-gray-400 font-mono">#{envio.gmcShipmentNumber}</span>
                                    </div>
                                    {/* 👇 USO DE ?. PARA EVITAR CRASH SI EL USUARIO ES NULL */}
                                    <h3 className="font-bold text-lg text-gray-800">{envio.user?.name || 'Cliente Desconocido'}</h3>
                                    <p className="text-sm text-gray-500 flex items-center gap-2">
                                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{envio.packages.length} paquetes</span>
                                        <span>•</span>
                                        <span className="font-medium text-gray-700">{envio.selectedCourier || 'Courier no seleccionado'}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Pagado</p>
                                        {/* 👇 USO DE ?. PARA EVITAR CRASH SI EL MONTO ES NULL */}
                                        <p className="font-bold text-green-600 text-lg">${envio.totalAmount?.toFixed(2) || '0.00'}</p>
                                    </div>
                                    <BotonDespachar id={envio.id} type="CONSOLIDATION" courier={envio.selectedCourier} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* PAQUETES INDIVIDUALES */}
            {paquetesSueltosListos.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-orange-800 border-b pb-2">
                        <Package className="text-orange-600"/> Paquetes Individuales ({paquetesSueltosListos.length})
                    </h2>
                    <div className="grid gap-4">
                        {paquetesSueltosListos.map((pkg) => (
                            <div key={pkg.id} className="group hover:bg-orange-50/50 transition-colors p-4 rounded-xl border border-gray-200 hover:border-orange-300 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Individual</span>
                                        <span className="text-xs text-gray-400 font-mono">{pkg.gmcTrackingNumber}</span>
                                    </div>
                                    {/* 👇 USO DE ?. PARA EVITAR CRASH SI EL USUARIO ES NULL */}
                                    <h3 className="font-bold text-lg text-gray-800">{pkg.user?.name || 'Cliente Desconocido'}</h3>
                                    <p className="text-sm text-gray-500 truncate max-w-md">{pkg.description}</p>
                                </div>
                                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Peso</p>
                                        <p className="font-bold text-gray-700 text-lg">{pkg.weightLbs} lb</p>
                                    </div>
                                    <BotonDespachar id={pkg.id} type="PACKAGE" courier={pkg.selectedCourier} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {consolidacionesListas.length === 0 && paquetesSueltosListos.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="bg-green-50 p-4 rounded-full mb-4">
                        <Truck size={40} className="text-green-500"/>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">¡Todo despachado!</h3>
                    <p className="text-gray-400 mt-2">No hay envíos pendientes de tracking.</p>
                </div>
            )}

        </div>
      </div>
    </div>
  );
}