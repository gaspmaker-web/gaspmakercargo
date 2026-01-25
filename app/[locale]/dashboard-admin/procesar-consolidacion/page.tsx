import prisma from '@/lib/prisma';
import Link from 'next/link';
import { 
  Truck, 
  Clock, 
  AlertCircle, 
  ArrowLeft,
  PackageOpen,
  CheckCircle,
  FileWarning,
  ChevronRight
} from 'lucide-react';
import MenuAccionesConsolidacion from '@/components/admin/MenuAccionesConsolidacion';
import ConsolidationCard from '@/components/admin/ConsolidationCard'; 
import SearchConsolidations from '@/components/admin/SearchConsolidations';

export const dynamic = 'force-dynamic';

export default async function ConsolidacionesPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const query = searchParams?.q || '';
  
  // 1. TRAEMOS TODO (FILTRADO POR TIPO)
  const consolidaciones = await prisma.consolidatedShipment.findMany({
    where: {
        // 🔥 FILTRO AGREGADO: Solo mostramos 'CONSOLIDATION'
        serviceType: 'CONSOLIDATION',

        // Mantenemos la búsqueda original
        ...(query ? {
            OR: [
                { user: { name: { contains: query, mode: 'insensitive' } } },
                { gmcShipmentNumber: { contains: query, mode: 'insensitive' } },
                { finalTrackingNumber: { contains: query, mode: 'insensitive' } }
            ]
        } : {})
    },
    include: {
      user: true,
      packages: true
    },
    orderBy: { updatedAt: 'desc' } 
  });

  // 2. CLASIFICACIÓN INTELIGENTE

  // A. Listos para Despachar (Pagados con dinero real)
  const listosParaDespachar = consolidaciones.filter(c => {
    const s = c.status;
    const isPaidState = s === 'PAGADO' || s === 'POR_ENVIAR' || s === 'PAID' || s === 'LISTO_PARA_ENVIO' || s === 'LISTO PARA ENVIO';
    const hasMoney = (c.totalAmount || 0) > 0;
    return isPaidState && hasMoney;
  });

  // B. Esperando Pago
  const esperandoPago = consolidaciones.filter(c => 
    c.status === 'PENDIENTE_PAGO'
  );

  // Helper local para detectar errores de precio
  function isZeroError(envio: any) {
      return (envio.totalAmount || 0) === 0 && (envio.status === 'LISTO_PARA_ENVIO' || envio.status === 'LISTO PARA ENVIO');
  }

  // C. Pendientes de Procesar (FILTRO MEJORADO)
  const pendientesProcesar = consolidaciones.filter(c => {
    const s = c.status;
    const isPaidState = s === 'PAGADO' || s === 'POR_ENVIAR' || s === 'PAID' || s === 'LISTO_PARA_ENVIO' || s === 'LISTO PARA ENVIO';
    const isZeroMoney = (c.totalAmount || 0) === 0;

    // 1. Descartar estados finales o de pago pendiente
    if (s === 'PENDIENTE_PAGO') return false;
    
    // Si está pagado y tiene dinero, NO es pendiente (se va a Listos para Despachar)
    if (isPaidState && !isZeroMoney) return false; 
    
    // 🔥 CORRECCIÓN AQUÍ: Excluir también lo que ya salió a reparto o destino
    if (s === 'ENVIADO' || s === 'ENTREGADO' || s === 'CANCELADO' || s === 'EN_REPARTO' || s === 'EN_ALMACEN_DESTINO') return false;

    // 2. FILTRO ANTI-INDIVIDUALES
    if ((!c.packages || c.packages.length <= 1) && !isZeroError(c)) {
        return false; 
    }

    return true;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <Link 
                    href="/dashboard-admin" 
                    className="inline-flex items-center text-gray-500 hover:text-blue-600 transition-colors font-medium text-sm mb-2"
                >
                    <ArrowLeft size={18} className="mr-2" />
                    Volver al Panel
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <PackageOpen className="text-blue-600" />
                    Gestión de Consolidaciones
                </h1>
                <p className="text-gray-500 mt-1">Ciclo Activo: Solicitud ➝ Medidas ➝ Pago ➝ Despacho.</p>
            </div>
            
            <SearchConsolidations />
        </div>

        <div className="space-y-10">

            {/* --- 1. CARRUSEL DE PENDIENTES DE PROCESAR --- */}
            {pendientesProcesar.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-md border-l-4 border-orange-500 animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-orange-800">
                            <AlertCircle className="text-orange-600"/> Pendientes de Procesar ({pendientesProcesar.length})
                        </h2>
                        {pendientesProcesar.length > 2 && (
                            <span className="text-xs text-orange-600 flex items-center animate-pulse">
                                Desliza para ver más <ChevronRight size={14}/>
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                        Solicitudes nuevas o envíos que necesitan cotización (Peso/Medidas).
                    </p>
                    
                    {/* CONTENEDOR DEL CARRUSEL */}
                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-2 px-2 scroll-smooth scrollbar-thin scrollbar-thumb-orange-200 scrollbar-track-transparent">
                        {pendientesProcesar.map((envio) => {
                             const isError = isZeroError(envio);
                             
                             return (
                                <div key={envio.id} className="relative snap-start shrink-0 w-full md:w-[400px]">
                                    {isError && (
                                        <div className="absolute -top-2 -right-1 z-10 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full border border-red-200 flex items-center gap-1 shadow-sm animate-bounce-slow">
                                            <FileWarning size={12}/> Requiere Precio
                                        </div>
                                    )}
                                    <ConsolidationCard request={envio} />
                                </div>
                             );
                        })}
                    </div>
                </div>
            )}

            {/* --- 2. ESPERANDO PAGO --- */}
            {esperandoPago.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-700">
                        <Clock className="text-yellow-500"/> Esperando Pago ({esperandoPago.length})
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                         {esperandoPago.map((envio) => (
                            <div key={envio.id} className="p-4 rounded-xl border border-gray-200 flex justify-between items-center bg-gray-50">
                                <div>
                                    <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">PENDIENTE PAGO</span>
                                    <h3 className="font-bold mt-1 text-gray-800 line-clamp-1">{envio.user?.name}</h3>
                                    <p className="text-sm text-gray-500 font-mono">
                                        {envio.weightLbs} lb • {envio.gmcShipmentNumber}
                                    </p>
                                </div>
                                <div className="text-right shrink-0 ml-2">
                                     <p className="text-lg font-bold text-gray-800">${envio.totalAmount?.toFixed(2)}</p>
                                     <p className="text-[10px] text-gray-400 uppercase">Por Cobrar</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- 3. LISTOS PARA DESPACHAR --- */}
            {listosParaDespachar.length > 0 ? (
                <div className="bg-white rounded-2xl p-6 shadow-md border border-green-100">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-700">
                        <Truck className="animate-pulse"/> Listos para Despachar ({listosParaDespachar.length})
                    </h2>
                    <div className="grid gap-4">
                        {listosParaDespachar.map((envio) => (
                            <div key={envio.id} className="bg-green-50/50 p-4 rounded-xl border border-green-200 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-green-600 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase">PAGADO & LISTO</span>
                                        <span className="text-xs text-gray-500 font-mono">#{envio.gmcShipmentNumber}</span>
                                    </div>
                                    <h3 className="font-bold text-lg">{envio.user?.name}</h3>
                                    <div className="flex gap-4 text-sm text-gray-600 mt-1">
                                       <span>⚖️ {envio.weightLbs} lb</span>
                                       <span>📦 {envio.packages?.length || 0} Paquetes</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                     <div className="text-right">
                                         <p className="text-xs text-gray-400 uppercase font-bold">Total Pagado</p>
                                         <p className="font-bold text-green-700 text-lg">${envio.totalAmount?.toFixed(2)}</p>
                                     </div>
                                     {/* 🔥 AQUÍ PASAMOS EL OBJETO COMPLETO 'shipment' 🔥 */}
                                     <MenuAccionesConsolidacion shipment={envio} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-8 opacity-50">
                    <CheckCircle className="mx-auto text-gray-300 mb-2"/>
                    <p className="text-sm text-gray-400">No hay envíos pagados listos para despachar.</p>
                </div>
            )}
            
        </div>
      </div>
    </div>
  );
}