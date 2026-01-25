"use client";

import Link from 'next/link';
import { 
  Calendar, Scale, AlertCircle, CheckCircle, Truck, 
  DollarSign, Ruler, MapPin, Box 
} from 'lucide-react';
// Asegúrate de que estos componentes existan, o coméntalos temporalmente si no los has migrado
import PackageSearch from '@/components/admin/PackageSearch';
import PackageActions from '@/components/admin/PackageActions'; 
import BackButton from '@/components/admin/BackButton';

interface PackageProps {
    allItems: any[];
    currentLocale: string;
}

export default function ActivePackagesClient({ allItems, currentLocale }: PackageProps) {
  return (
    <div className="min-h-screen bg-gray-50 p-6 font-montserrat">
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
                                        <PackageActions pkg={pkg} locale={currentLocale} />
                                    </td>
                                </tr>
                            )})
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}