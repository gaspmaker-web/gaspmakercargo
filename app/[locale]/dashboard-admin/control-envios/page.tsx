'use client'; // 👈 ESTO ES LA CLAVE DEL ÉXITO

import { useEffect, useState } from 'react';
import { Package, Box, Truck, Loader2 } from 'lucide-react';
import BotonDespachar from '@/components/admin/BotonDespachar'; 
import { obtenerDespachos } from './actions'; // Importamos la lógica del otro archivo

export default function Page({ params }: { params: { locale: string } }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ consolidaciones: any[], paquetes: any[] }>({ consolidaciones: [], paquetes: [] });

  useEffect(() => {
    // Cargamos los datos SOLO cuando el navegador ya mostró la página
    const loadData = async () => {
        const result = await obtenerDespachos();
        if (result.success) {
            setData(result.data);
        }
        setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
      return (
          <div className="p-10 flex flex-col items-center justify-center min-h-[50vh] text-gray-500">
              <Loader2 className="animate-spin mb-4 text-blue-600" size={40} />
              <p>Cargando envíos pendientes...</p>
          </div>
      );
  }

  const { consolidaciones, paquetes } = data;
  const total = consolidaciones.length + paquetes.length;

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen font-sans text-gray-800">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <Truck className="text-blue-600"/> Control de Envíos
                </h1>
                <p className="text-gray-500 mt-1">
                    Gestiona los envíos que ya han sido pagados.
                </p>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border text-sm font-bold text-gray-600">
                Total Pendiente: {total}
            </div>
        </div>

        <div className="space-y-8">
            {/* CONSOLIDACIONES */}
            {consolidaciones.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-800 border-b pb-2">
                        <Box className="text-blue-600"/> Consolidaciones ({consolidaciones.length})
                    </h2>
                    <div className="grid gap-4">
                        {consolidaciones.map((envio) => (
                            <div key={envio.id} className="group hover:bg-blue-50/50 transition-colors p-4 rounded-xl border border-gray-200 hover:border-blue-300 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Consolidado</span>
                                        <span className="text-xs text-gray-400 font-mono">#{envio.gmcShipmentNumber}</span>
                                    </div>
                                    <h3 className="font-bold text-lg text-gray-800">{envio.user?.name || 'Cliente'}</h3>
                                    <p className="text-sm text-gray-500">
                                        {envio.packages?.length || 0} paquetes • {envio.selectedCourier || 'N/A'}
                                    </p>
                                </div>
                                <BotonDespachar id={envio.id} type="CONSOLIDATION" courier={envio.selectedCourier} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* PAQUETES */}
            {paquetes.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-orange-800 border-b pb-2">
                        <Package className="text-orange-600"/> Paquetes Individuales ({paquetes.length})
                    </h2>
                    <div className="grid gap-4">
                        {paquetes.map((pkg) => (
                            <div key={pkg.id} className="group hover:bg-orange-50/50 transition-colors p-4 rounded-xl border border-gray-200 hover:border-orange-300 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Individual</span>
                                        <span className="text-xs text-gray-400 font-mono">{pkg.gmcTrackingNumber}</span>
                                    </div>
                                    <h3 className="font-bold text-lg text-gray-800">{pkg.user?.name || 'Cliente'}</h3>
                                    <p className="text-sm text-gray-500 truncate max-w-md">{pkg.description}</p>
                                </div>
                                <BotonDespachar id={pkg.id} type="PACKAGE" courier={pkg.selectedCourier} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {total === 0 && (
                 <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                    <Truck size={40} className="text-green-500 mb-2"/>
                    <h3 className="text-xl font-bold text-gray-800">¡Todo despachado!</h3>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}