import { Suspense } from 'react';
import { Package, Box, Truck, AlertTriangle } from 'lucide-react';
// ❌ NO IMPORTAMOS EL BOTÓN TODAVÍA (Para descartar que sea el culpable)
// import BotonDespachar from '@/components/admin/BotonDespachar'; 

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: { locale: string };
}

async function ListaSegura() {
  let consolidaciones: any[] = [];
  let paquetes: any[] = [];
  let errorMsg = "";

  try {
      // ✅ IMPORTACIÓN SEGURA: Solo carga la BD si el servidor está listo
      const { default: prisma } = await import('@/lib/prisma');

      consolidaciones = await prisma.consolidatedShipment.findMany({
        where: { status: 'POR_ENVIAR' }, 
        include: { user: true, packages: true },
        orderBy: { updatedAt: 'asc' }
      });

      paquetes = await prisma.package.findMany({
        where: { status: 'POR_ENVIAR', consolidatedShipmentId: null },
        include: { user: true },
        orderBy: { updatedAt: 'asc' }
      });

  } catch (error: any) {
      console.error("⚠️ Error controlado en Build:", error);
      // Si falla, no rompemos la página, solo guardamos el mensaje
      errorMsg = "Modo Seguro (Sin Conexión)";
  }

  // Si hubo error, mostramos aviso y NO fallamos el Build
  if (errorMsg) {
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center my-4">
             <AlertTriangle className="mx-auto text-yellow-500 mb-2" size={24}/>
             <p className="text-yellow-700 font-bold">{errorMsg}</p>
             <p className="text-xs text-gray-500">La base de datos conectará en vivo.</p>
        </div>
      );
  }

  const total = consolidaciones.length + paquetes.length;

  if (total === 0) {
      return <div className="p-10 text-center text-gray-400">Todo despachado.</div>;
  }

  return (
    <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border font-bold text-gray-700">
            Total Envíos: {total}
        </div>
        
        {/* Renderizado simple para probar que la BD funciona */}
        <div className="grid gap-4">
            {consolidaciones.map(c => (
                <div key={c.id} className="bg-white p-4 rounded border flex justify-between items-center">
                    <div>
                        <div className="font-bold text-blue-700">Consolidado #{c.gmcShipmentNumber}</div>
                        <div className="text-sm">{c.user?.name || 'Cliente'}</div>
                    </div>
                    {/* BOTÓN HTML SIMPLE DE PRUEBA */}
                    <button className="bg-gray-200 text-gray-500 px-3 py-1 rounded text-sm cursor-not-allowed">
                        Despachar (Prueba)
                    </button>
                </div>
            ))}
            {paquetes.map(p => (
                <div key={p.id} className="bg-white p-4 rounded border flex justify-between items-center">
                    <div>
                        <div className="font-bold text-orange-700">Paquete {p.gmcTrackingNumber}</div>
                        <div className="text-sm">{p.user?.name || 'Cliente'}</div>
                    </div>
                    {/* BOTÓN HTML SIMPLE DE PRUEBA */}
                    <button className="bg-gray-200 text-gray-500 px-3 py-1 rounded text-sm cursor-not-allowed">
                        Despachar (Prueba)
                    </button>
                </div>
            ))}
        </div>
    </div>
  );
}

export default function Page({ params }: PageProps) {
  return (
    <div className="p-10 bg-gray-50 min-h-screen">
        <h1 className="text-2xl font-bold mb-6 flex gap-2 items-center">
            <Truck className="text-blue-600"/> Control de Envíos
        </h1>
        <Suspense fallback={<div className="text-center p-10">Cargando datos...</div>}>
            <ListaSegura />
        </Suspense>
    </div>
  );
}