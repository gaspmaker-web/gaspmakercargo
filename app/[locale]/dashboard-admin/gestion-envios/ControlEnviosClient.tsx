'use client';

import { useEffect, useState } from 'react';
import { Package, Box, Truck, Loader2 } from 'lucide-react';
// 🛑 COMENTAMOS EL SOSPECHOSO TEMPORALMENTE
// import BotonDespachar from '@/components/admin/BotonDespachar'; 

export default function ControlEnviosClient() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ consolidaciones: any[], paquetes: any[] }>({ consolidaciones: [], paquetes: [] });

  useEffect(() => {
    const loadData = async () => {
        try {
            // ✅ USAMOS FETCH: Esto es seguro
            const response = await fetch('/api/admin/envios-pendientes');
            const result = await response.json();
            
            if (result.success) {
                setData(result.data);
            }
        } catch (error) {
            console.error("Error cargando envios", error);
        } finally {
            setLoading(false);
        }
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
                        {consolidaciones.map((envio: any) => (
                            <div key={envio.id} className="bg-white p-4 rounded-xl border flex justify-between items-center">
                                <div>
                                    <span className="text-xs font-bold text-blue-600">#{envio.gmcShipmentNumber}</span>
                                    <div className="font-bold">{envio.user?.name || 'Cliente'}</div>
                                    <div className="text-xs text-gray-500">{envio.packages?.length || 0} paquetes</div>
                                </div>
                                {/* 🛑 AQUÍ COMENTAMOS EL COMPONENTE QUE CAUSA EL ERROR */}
                                {/* <BotonDespachar id={envio.id} type="CONSOLIDATION" courier={envio.selectedCourier} /> */}
                                
                                {/* Ponemos un botón tonto temporal para que compile */}
                                <button className="bg-gray-200 text-gray-500 px-4 py-2 rounded text-sm cursor-not-allowed">
                                    Despachar (Test Mode)
                                </button>
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
                        {paquetes.map((pkg: any) => (
                            <div key={pkg.id} className="bg-white p-4 rounded-xl border flex justify-between items-center">
                                <div>
                                    <span className="text-xs font-bold text-orange-600">{pkg.gmcTrackingNumber}</span>
                                    <div className="font-bold">{pkg.user?.name || 'Cliente'}</div>
                                </div>
                                {/* 🛑 COMENTADO AQUÍ TAMBIÉN */}
                                {/* <BotonDespachar id={pkg.id} type="PACKAGE" courier={pkg.selectedCourier} /> */}
                                
                                <button className="bg-gray-200 text-gray-500 px-4 py-2 rounded text-sm cursor-not-allowed">
                                    Despachar (Test Mode)
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
             {total === 0 && (
                 <div className="text-center py-20 text-gray-400">Todo despachado.</div>
             )}
        </div>
       </div>
    </div>
  );
}