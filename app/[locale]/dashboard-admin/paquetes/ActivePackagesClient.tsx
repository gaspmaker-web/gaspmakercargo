"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Calendar, Scale, AlertCircle, CheckCircle, Truck, 
  DollarSign, Ruler, MapPin, Box, X, User, Printer 
} from 'lucide-react';

import PackageSearch from '@/components/admin/PackageSearch';
import PackageActions from '@/components/admin/PackageActions'; 
import BackButton from '@/components/admin/BackButton';

interface PackageProps {
    allItems: any[];
    currentLocale: string;
}

export default function ActivePackagesClient({ allItems, currentLocale }: PackageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');
  
  // --- ESTADOS PARA EL MODAL DE ENTREGA ---
  const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [staffName, setStaffName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔥 LÓGICA DEL FILTRO (AHORA INCLUYE PRE-ALERTAS)
  const displayItems = allItems.filter((pkg: any) => {
      // Filtro 1: Pagados pendientes de despacho
      if (filterParam === 'pagados') {
          const isConsolidatedBox = pkg.type === 'SHIPMENT';
          if (isConsolidatedBox) {
              return pkg.paymentId && !pkg.finalTrackingNumber && pkg.status !== 'ENVIADO' && pkg.status !== 'ENTREGADO';
          } else {
              return pkg.stripePaymentId && !pkg.finalTrackingNumber && pkg.status !== 'ENVIADO' && pkg.status !== 'ENTREGADO' && pkg.status !== 'RECIBIDO_EN_TIENDA';
          }
      }
      
      // Filtro 2: Pre-alertas (paquetes entrantes)
      if (filterParam === 'prealertas') {
          return pkg.status === 'PRE_ALERTA' || pkg.status === 'PRE_ALERTADO';
      }

      return true;
  });

  const handleOpenDeliverModal = (pkgId: string) => {
      setSelectedPackageId(pkgId);
      setStaffName(""); 
      setIsDeliverModalOpen(true);
  };

  const handleConfirmDelivery = async () => {
      if (!staffName.trim()) {
          alert("Por favor, escribe el nombre del personal.");
          return;
      }

      setIsSubmitting(true);
      try {
          const res = await fetch('/api/admin/packages/deliver-store', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  packageId: selectedPackageId, 
                  deliveredBy: staffName 
              })
          });

          if (res.ok) {
              setIsDeliverModalOpen(false);
              router.refresh(); 
          } else {
              const data = await res.json();
              alert(data.message || "Error al procesar la entrega.");
          }
      } catch (error) {
          console.error(error);
          alert("Error de conexión.");
      } finally {
          setIsSubmitting(false);
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-montserrat relative">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-6 flex justify-between items-center">
          <BackButton href={`/${currentLocale}/dashboard-admin`} label="Volver al Panel" />
        </div>

        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gmc-gris-oscuro font-garamond">Inventario & Despachos</h1>
                <p className="text-gray-500 mt-1">Gestiona la entrada y salida de mercancía.</p>
            </div>
            
            <div className="flex flex-col md:flex-row items-end gap-3 w-full md:w-auto">
                <div className="flex flex-col items-end gap-1">
                   <div className="text-xs font-bold text-gray-400 mb-1">
                      {displayItems.length} {displayItems.length === 1 ? 'Item' : 'Items'}
                   </div>
                   <PackageSearch />
                </div>
            </div>
        </div>

        {/* =========================================
            BANNERS DE FILTROS ACTIVOS 
            ========================================= */}
        {/* BANNER 1: PAGADOS */}
        {filterParam === 'pagados' && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex justify-between items-center shadow-sm animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center gap-3 font-bold text-sm">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    Mostrando únicamente paquetes pagados pendientes de despacho ({displayItems.length})
                </div>
                <button 
                    onClick={() => router.push(`/${currentLocale}/dashboard-admin/paquetes`)}
                    className="flex items-center gap-1 text-red-500 hover:text-red-800 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold"
                >
                    <X size={14} /> Quitar Filtro
                </button>
            </div>
        )}

        {/* 🔥 BANNER 2: PRE-ALERTAS 🔥 */}
        {filterParam === 'prealertas' && (
            <div className="mb-6 bg-purple-50 border border-purple-200 text-purple-700 px-4 py-3 rounded-xl flex justify-between items-center shadow-sm animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center gap-3 font-bold text-sm">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-600"></span>
                    </span>
                    Mostrando únicamente pre-alertas entrantes esperando recepción ({displayItems.length})
                </div>
                <button 
                    onClick={() => router.push(`/${currentLocale}/dashboard-admin/paquetes`)}
                    className="flex items-center gap-1 text-purple-600 hover:text-purple-800 bg-purple-100 hover:bg-purple-200 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold"
                >
                    <X size={14} /> Quitar Filtro
                </button>
            </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative z-0">
            <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold border-b border-gray-200">
                        <tr>
                            <th className="p-4">Tracking & ID</th>
                            <th className="p-4">Cliente</th>
                            <th className="p-4">Descripción</th>
                            <th className="p-4 text-center">Info Envío / Peso</th>
                            <th className="p-4 text-right">Total</th>
                            <th className="p-4 text-center">Estado</th>
                            <th className="p-4 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {displayItems.length === 0 ? (
                             <tr>
                                <td colSpan={7} className="p-10 text-center text-gray-400">
                                    {filterParam === 'pagados' 
                                        ? 'No hay paquetes pagados pendientes.' 
                                        : filterParam === 'prealertas' 
                                        ? 'No hay pre-alertas pendientes de recepción.' 
                                        : 'No hay paquetes activos.'}
                                </td>
                             </tr>
                        ) : (
                            displayItems.map((pkg: any) => {
                                const isConsolidatedBox = pkg.type === 'SHIPMENT'; 

                               // 🔥 USAMOS EL ID DEL GRUPO PARA QUE COINCIDA CON EL RECIBO DEL CLIENTE
                                const idToUse = pkg.consolidatedShipmentId ? pkg.consolidatedShipmentId : pkg.id;
                                const shortId = idToUse ? idToUse.substring(0, 8).toUpperCase() : 'N/A';
                                
                                const isPreAlert = pkg.status === 'PRE_ALERTA' || pkg.status === 'PRE_ALERTADO';
                                const isProcessing = pkg.status === 'EN_PROCESAMIENTO';
                                const isStorePickup = !isConsolidatedBox && (pkg.status === 'PENDIENTE_RETIRO' || pkg.selectedCourier === 'CLIENTE_RETIRO');

                                const hasCourierAssigned = Boolean(pkg.selectedCourier && pkg.selectedCourier !== 'CLIENTE_RETIRO');
                                const isReadyToShip = (!isConsolidatedBox && (pkg.status === 'EN_PROCESO_ENVIO' || pkg.status === 'ENVIADO' || hasCourierAssigned)) || 
                                                      (isConsolidatedBox && (pkg.status === 'PAGADO' || pkg.status === 'ENVIADO' || hasCourierAssigned));

                                let price = pkg.shippingTotalPaid || 0;
                                if (!isConsolidatedBox && pkg.consolidatedShipmentId && pkg.shippingSubtotal > 0) {
                                    price = pkg.shippingSubtotal;
                                } 
                                else if (!isConsolidatedBox && pkg.consolidatedShipment?.totalAmount) {
                                    const totalGroupAmount = pkg.consolidatedShipment.totalAmount;
                                    const packageCount = pkg.consolidatedShipment.packages?.length || 1;
                                    price = totalGroupAmount / packageCount;
                                }

                                return (
                                <tr key={pkg.id} className={`transition-colors ${isConsolidatedBox ? 'bg-purple-50/30' : isProcessing ? 'bg-orange-50' : isReadyToShip ? 'bg-green-50/60' : isPreAlert ? 'bg-yellow-50/20' : 'hover:bg-blue-50/30'}`}>
                                    
                                    <td className="p-4">
                                        <Link 
                                            href={isConsolidatedBox 
                                                ? `/${currentLocale}/dashboard-admin/shipments/${pkg.id}` 
                                                : `/${currentLocale}/dashboard-admin/paquetes/${pkg.id}`
                                            }
                                            className="group block cursor-pointer hover:bg-gray-50 p-2 rounded -ml-2"
                                        >
                                            <div className="font-mono font-bold text-blue-600 hover:underline flex items-center gap-2">
                                                {isConsolidatedBox && <Box size={16} className="text-purple-600"/>}
                                                {pkg.gmcTrackingNumber}
                                                {isProcessing && <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>}
                                            </div>
                                            {/* 🔥 AQUÍ ESTÁ EL SHORT ID 🔥 */}
                                            <div className="text-[10px] text-gray-500 font-bold font-mono mt-1 bg-gray-100 inline-block px-1.5 py-0.5 rounded border border-gray-200">
                                                ID: {shortId}
                                            </div>
                                            <div className="text-[10px] text-gray-400 flex items-center gap-1 font-mono mt-1">
                                                Ref: {pkg.carrierTrackingNumber || 'N/A'}
                                            </div>
                                        </Link>
                                    </td>

                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                                                {pkg.user?.name?.[0] || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-700">{pkg.user?.name || 'Anon'}</p>
                                                <p className="text-xs text-gray-500 font-mono">{pkg.user?.suiteNo} • {pkg.user?.countryCode}</p>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="p-4 text-sm text-gray-600 max-w-[150px] truncate">
                                        {isConsolidatedBox ? (
                                            <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                                                Consolidación
                                            </span>
                                        ) : (
                                            pkg.description || 'Sin descripción'
                                        )}
                                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                            <Calendar size={10} />
                                            {new Date(pkg.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>

                                    <td className="p-4 text-center">
                                        {isReadyToShip || isConsolidatedBox ? (
                                            <div className="flex flex-col items-center justify-center animate-fadeIn">
                                                <span className="text-base font-black text-gray-800 uppercase tracking-tight">
                                                    {pkg.selectedCourier || 'COURIER SIN ASIGNAR'}
                                                </span>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Truck size={10} className="text-gray-400"/>
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase truncate max-w-[140px]">
                                                        {pkg.courierService || 'Estándar'}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : isStorePickup ? (
                                            <div className="text-center opacity-80">
                                                 <div className="text-sm font-bold text-gray-700 flex items-center justify-center gap-1">
                                                    <Scale size={14} className="text-gray-400"/> {pkg.weightLbs || 0} lbs
                                                 </div>
                                                 <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                                                     RETIRARÁ EN PERSONA
                                                 </span>
                                            </div>
                                        ) : isPreAlert ? (
                                            <div className="text-center opacity-70">
                                                <div className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 uppercase inline-flex items-center gap-1">
                                                    <Truck size={12} /> EN TRÁNSITO
                                                </div>
                                            </div>
                                        ) : isProcessing ? (
                                            <div className="text-center">
                                                <div className="text-sm font-bold text-orange-600 flex items-center justify-center gap-1 animate-pulse">
                                                    <Scale size={14} /> 0 lbs
                                                </div>
                                                <div className="text-[10px] text-orange-400 font-bold">REQUIERE ACCIÓN</div>
                                            </div>
                                        ) : (
                                            <div className="text-center opacity-60">
                                                <div className="text-sm font-bold text-gray-700 flex items-center justify-center gap-1">
                                                    <Scale size={14} className="text-gray-400"/> {pkg.weightLbs || 0} lbs
                                                 </div>
                                                 <div className="text-xs text-gray-400">{pkg.lengthIn}x{pkg.widthIn}x{pkg.heightIn} in</div>
                                            </div>
                                        )}
                                    </td>

                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-1 font-bold text-green-700">
                                            <DollarSign size={14} className="text-green-500"/>
                                            {price > 0 ? price.toFixed(2) : '0.00'}
                                        </div>
                                    </td>

                                    <td className="p-4 text-center">
                                        {pkg.status === 'ENVIADO' ? (
                                            <span className="text-[10px] font-bold px-2 py-1 rounded-full border bg-blue-100 text-blue-800 border-blue-200 shadow-sm flex items-center justify-center gap-1">
                                                <CheckCircle size={10}/> ENVIADO
                                            </span>
                                        ) : isReadyToShip ? (
                                            <span className="text-[10px] font-bold px-2 py-1 rounded-full border bg-green-100 text-green-800 border-green-200 animate-pulse flex items-center justify-center gap-1">
                                                <CheckCircle size={10}/> LISTO PARA ENVÍO
                                            </span>
                                        ) : isStorePickup ? (
                                            <span className="text-[10px] font-bold px-2 py-1 rounded-full border bg-emerald-100 text-emerald-800 border-emerald-200 flex items-center justify-center gap-1 shadow-sm animate-pulse">
                                                <MapPin size={10}/> ENTREGAR EN TIENDA
                                            </span>
                                        ) : isConsolidatedBox ? (
                                            <span className="text-[10px] font-bold px-2 py-1 rounded-full border bg-purple-100 text-purple-800 border-purple-200 flex items-center justify-center gap-1 shadow-sm">
                                                <Box size={10}/> CONSOLIDADO
                                            </span>
                                        ) : isPreAlert ? (
                                            <span className="text-[10px] font-bold px-2 py-1 rounded-full border bg-purple-100 text-purple-800 border-purple-200 animate-pulse flex items-center justify-center gap-1 shadow-sm">
                                                <AlertCircle size={10}/> PRE ALERTA
                                            </span>
                                        ) : isProcessing ? (
                                            <span className="text-[10px] font-bold px-2 py-1 rounded-full border bg-orange-100 text-orange-700 border-orange-200 flex items-center justify-center gap-1">
                                                <Ruler size={10}/> POR MEDIR
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-bold px-2 py-1 rounded-full border bg-gray-50 text-gray-600 border-gray-200">
                                                {pkg.status.replace(/_/g, ' ')}
                                            </span>
                                        )}
                                    </td>

                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {(pkg.shippingLabelUrl || pkg.labelUrl) && (
                                                <a 
                                                    href={pkg.shippingLabelUrl || pkg.labelUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors shadow-sm"
                                                    title="Imprimir Label Carrier"
                                                >
                                                    <Printer size={18} />
                                                </a>
                                            )}
                                            <PackageActions 
                                                pkg={pkg} 
                                                locale={currentLocale} 
                                                onDeliverStore={() => handleOpenDeliverModal(pkg.id)}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            )})
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Modal de Entrega (se mantiene intacto) */}
        {isDeliverModalOpen && (
            <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
                    
                    <div className="bg-emerald-50 p-5 border-b border-emerald-100 flex justify-between items-center">
                        <h3 className="font-bold text-emerald-800 flex items-center gap-2 text-lg">
                            <MapPin className="text-emerald-600" size={20}/>
                            Entregar en Tienda
                        </h3>
                        <button onClick={() => setIsDeliverModalOpen(false)} className="text-emerald-400 hover:text-emerald-600 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="text-center mb-5">
                            <p className="text-sm text-gray-500 leading-relaxed mb-4">
                                Estás a punto de marcar este paquete como <strong>ENTREGADO</strong> al cliente en la bodega.
                            </p>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-left">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                                    Entregado Por (Personal):
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                                    <input 
                                        type="text" 
                                        autoFocus
                                        placeholder="Tu nombre..." 
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                        value={staffName}
                                        onChange={(e) => setStaffName(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setIsDeliverModalOpen(false)}
                                className="flex-1 py-2.5 text-gray-600 font-bold text-sm hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleConfirmDelivery}
                                disabled={isSubmitting || !staffName.trim()}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {isSubmitting ? 'Procesando...' : 'Confirmar Entrega'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}