'use client';

import React, { useState } from 'react';
import { Package, Truck, CheckCircle, Loader2, ChevronDown, ChevronUp, AlertTriangle, FileText, ArrowRight, Upload } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface PackageType {
  id: string;
  description: string | null;
  gmcTrackingNumber: string;
  weightLbs: number | null;
  status: string;
  courier: string | null;
  invoiceUrl: string | null;
}

export default function ActiveShipmentsList({ packages }: { packages: PackageType[] }) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale || 'es';

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const readyPackages = packages.filter(p => p.status === 'RECIBIDO_MIAMI');

  const handleSelection = (id: string, weight: number) => {
    const isCurrentlySelected = selectedIds.includes(id);

    if (isCurrentlySelected) {
        setSelectedIds(selectedIds.filter(pid => pid !== id));
        return;
    }

    if (weight > 50) {
        if (selectedIds.length > 0) return alert("⚠️ Los paquetes > 50 lbs deben enviarse SOLOS.");
        setSelectedIds([id]);
        return;
    }

    const hasHeavyPackageSelected = selectedIds.some(pid => {
        const pkg = readyPackages.find(p => p.id === pid);
        return (pkg?.weightLbs || 0) > 50;
    });

    if (hasHeavyPackageSelected) return alert("⚠️ No puedes mezclar paquetes normales con uno pesado.");
    if (selectedIds.length >= 7) return alert("⚠️ Máximo 7 paquetes por consolidación.");

    setSelectedIds([...selectedIds, id]);
  };

  const handleConsolidate = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
        const res = await fetch('/api/consolidate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ packageIds: selectedIds })
        });
        const data = await res.json();
        if (res.ok) {
            alert("✅ Solicitud creada exitosamente.");
            setSelectedIds([]); 
            router.refresh();
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        alert("Error de conexión");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300">
      
      {/* Header del Acordeón (Responsive) */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-white cursor-pointer hover:bg-gray-50 select-none"
      >
        <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-full text-blue-600 shrink-0">
                <Package size={20}/>
            </div>
            <div>
                <h3 className="font-bold text-gray-800 font-garamond text-base md:text-lg">Active Shipments</h3>
                <p className="text-xs text-gray-500 leading-tight">
                    {readyPackages.length} paquete(s) listos en Miami
                </p>
            </div>
        </div>
        {isOpen ? <ChevronUp className="text-gray-400 shrink-0"/> : <ChevronDown className="text-gray-400 shrink-0"/>}
      </div>

      {/* Cuerpo del Acordeón */}
      {isOpen && (
        <div className="p-3 md:p-5 bg-gray-50/50 max-h-[600px] overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2 duration-200">
            
            {/* Barra Flotante de Acción */}
            {selectedIds.length > 0 && (
                <div className="sticky top-0 z-10 bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4 flex flex-wrap justify-between items-center shadow-sm gap-2">
                    <span className="text-xs font-bold text-blue-800 flex items-center gap-1">
                        <CheckCircle size={14}/> {selectedIds.length} Seleccionados
                    </span>
                    <button 
                        onClick={handleConsolidate}
                        disabled={loading}
                        className="bg-gmc-dorado-principal text-black px-4 py-2 rounded-lg text-xs font-bold hover:bg-yellow-500 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                        {loading ? <Loader2 size={14} className="animate-spin"/> : <Truck size={14}/>}
                        {selectedIds.length > 1 ? "Consolidar Ahora" : "Crear Envío"}
                    </button>
                </div>
            )}

            <div className="space-y-3">
                {readyPackages.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        No hay paquetes listos.
                    </div>
                ) : (
                    readyPackages.map((pkg) => {
                        const isSelected = selectedIds.includes(pkg.id);
                        const isOverweight = (pkg.weightLbs || 0) > 50;
                        const hasInvoice = !!pkg.invoiceUrl;
                        
                        return (
                            <div 
                                key={pkg.id}
                                className={`
                                    relative rounded-xl border transition-all group bg-white overflow-hidden
                                    ${isSelected ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/30' : 'border-gray-200 hover:border-blue-300'}
                                `}
                            >
                                {/* ÁREA DE SELECCIÓN */}
                                <div 
                                    onClick={() => handleSelection(pkg.id, pkg.weightLbs || 0)}
                                    className="p-3 md:p-4 flex items-start gap-3 md:gap-4 cursor-pointer"
                                >
                                    {/* Checkbox */}
                                    <div className={`mt-1 w-5 h-5 md:w-6 md:h-6 shrink-0 rounded border flex items-center justify-center transition-colors 
                                        ${isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}
                                    `}>
                                        {isSelected && <CheckCircle size={14} className="text-white" />}
                                    </div>

                                    {/* Info del Paquete */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap justify-between items-start gap-1">
                                            <h4 className="font-bold text-gray-800 text-sm break-all">{pkg.gmcTrackingNumber}</h4>
                                            <span className="bg-green-100 text-green-700 text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded shrink-0">MIAMI</span>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1 line-clamp-1">{pkg.description || 'Sin descripción'}</p>
                                        
                                        <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold text-gray-500">
                                            <span className={`px-2 py-1 rounded whitespace-nowrap ${isOverweight ? 'bg-orange-100 text-orange-700' : 'bg-gray-100'}`}>
                                                {pkg.weightLbs} lb
                                            </span>
                                            {isOverweight && (
                                                <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded whitespace-nowrap">
                                                    <AlertTriangle size={10}/> Pesado
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* FOOTER DE ACCIONES (Mobile-Friendly) */}
                                <div className="bg-gray-50 px-3 py-2 md:px-4 md:py-3 border-t border-gray-100 flex flex-wrap justify-between items-center gap-2">
                                    
                                    {!hasInvoice ? (
                                        <Link 
                                            href={`/${locale}/dashboard-cliente/paquetes/${pkg.id}`}
                                            className="text-[10px] md:text-xs font-bold text-red-600 bg-white hover:bg-red-50 px-3 py-1.5 rounded border border-red-200 flex items-center gap-1 transition-colors shadow-sm"
                                        >
                                            <Upload size={12}/> Subir Factura
                                        </Link>
                                    ) : (
                                        <span className="text-[10px] md:text-xs text-green-600 flex items-center gap-1 font-bold bg-white px-2 py-1 rounded border border-green-100">
                                            <FileText size={12}/> Factura OK
                                        </span>
                                    )}

                                    <Link 
                                        href={`/${locale}/dashboard-cliente/paquetes/${pkg.id}`}
                                        className="text-[10px] md:text-xs font-bold text-gmc-dorado-principal hover:text-yellow-600 hover:bg-yellow-50 px-2 py-1 rounded transition-colors flex items-center gap-1 ml-auto"
                                    >
                                        Ver Detalles <ArrowRight size={12}/>
                                    </Link>
                                </div>

                            </div>
                        );
                    })
                )}
            </div>
        </div>
      )}
    </div>
  );
}