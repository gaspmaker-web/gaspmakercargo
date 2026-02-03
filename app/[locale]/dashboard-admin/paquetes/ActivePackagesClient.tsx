"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Calendar, Scale, AlertCircle, CheckCircle, Truck, 
  DollarSign, Ruler, MapPin, Box, X, User 
} from 'lucide-react';
// Asegúrate de que estos componentes existan
import PackageSearch from '@/components/admin/PackageSearch';
import PackageActions from '@/components/admin/PackageActions'; 
import BackButton from '@/components/admin/BackButton';

interface PackageProps {
    allItems: any[];
    currentLocale: string;
}

export default function ActivePackagesClient({ allItems, currentLocale }: PackageProps) {
  const router = useRouter();
  
  // --- ESTADOS PARA EL MODAL DE ENTREGA ---
  const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [staffName, setStaffName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- FUNCIÓN PARA ABRIR EL MODAL ---
  // Esta función se pasará a PackageActions o se usará directamente
  const handleOpenDeliverModal = (pkgId: string) => {
      setSelectedPackageId(pkgId);
      setStaffName(""); // Limpiar campo
      setIsDeliverModalOpen(true);
  };

  // --- FUNCIÓN PARA CONFIRMAR LA ENTREGA ---
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
              router.refresh(); // Refrescar la tabla
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
                      {allItems.length} {allItems.length === 1 ? 'Item' : 'Items'}
                   </div>
                   <PackageSearch />
                </div>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative z-0">
            <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold border-b border-gray-200">
                        <tr>
                            <th className="p-4">Tracking</th>
                            <th className="p-4">Cliente</th>
                            <th className="p-4">Descripción</th>
                            <th className="p-4 text-center">Info Envío / Peso</th>
                            <th className="p-4 text-right">Total</th>
                            <th className="p-4 text-center">Estado</th>
                            <th className="p-4 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {allItems.length === 0 ? (
                             <tr><td colSpan={7} className="p-10 text-center text-gray-400">No hay paquetes activos.</td></tr>
                        ) : (
                            allItems.map((pkg: any) => {
                                const isConsolidatedBox = pkg.type === 'SHIPMENT'; 

                                const isPreAlert = pkg.status === 'PRE_ALERTA';
                                const isProcessing = pkg.status === 'EN_PROCESAMIENTO';
                                const isStorePickup = !isConsolidatedBox && (pkg.status === 'PENDIENTE_RETIRO' || pkg.selectedCourier === 'CLIENTE_RETIRO');

                                const isReadyToShip = (!isConsolidatedBox && pkg.status === 'EN_PROCESO_ENVIO') || 
                                                      (isConsolidatedBox && pkg.status === 'PAGADO');

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
                                <tr key={pkg.id} className={`transition-colors ${isConsolidatedBox ? 'bg-purple-50/30' : isProcessing ? 'bg-orange-50' : isReadyToShip ? 'bg-green-50/60' : 'hover:bg-blue-50/30'}`}>
                                    
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
                                        {isReadyToShip ? (
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
                                            <span className="text-[10px] font-bold px-2 py-1 rounded-full border bg-yellow-100 text-yellow-800 border-yellow-200 animate-pulse flex items-center justify-center gap-1">
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
                                        {/* 🔥 PASAMOS LA FUNCIÓN DE APERTURA AL COMPONENTE HIJO */}
                                        <PackageActions 
                                            pkg={pkg} 
                                            locale={currentLocale} 
                                            onDeliverStore={() => handleOpenDeliverModal(pkg.id)}
                                        />
                                    </td>
                                </tr>
                            )})
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* ===================================================================
           MODAL DE ENTREGA EN TIENDA (NUEVO)
           =================================================================== */}
        {isDeliverModalOpen && (
            <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
                    
                    {/* Header del Modal */}
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

                        {/* Botones de Acción */}
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