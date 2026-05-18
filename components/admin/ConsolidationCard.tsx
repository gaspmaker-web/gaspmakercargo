'use client';

import React, { useState } from 'react';
import { Package, MapPin, Calendar, ArrowRight, X, Loader2, Box, Ruler, DollarSign, Truck, Plane } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ConsolidationCard({ request }: { request: any }) {
  const router = useRouter();
  
  // Estado del Modal
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Datos del Formulario
  const [finalWeight, setFinalWeight] = useState('');
  const [dims, setDims] = useState({ length: '', width: '', height: '' });
  
  // Estado para Valor Declarado
  const [finalValue, setFinalValue] = useState('');

  // 🔥 DETECCIÓN DEL SERVICIO DE SUPABASE
  const isLocalDelivery = request.serviceType === 'LOCAL_DELIVERY';

  // Lógica para Procesar
  const handleProcess = async () => {
    // 1. Validaciones visuales
    if (!finalWeight || !dims.length || !dims.width || !dims.height) {
        return alert("⚠️ Por favor ingresa el Peso y las 3 Medidas.");
    }

    setIsSaving(true);
    try {
        const res = await fetch('/api/admin/consolidate-confirm', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                consolidationId: request.id, 
                finalWeight: parseFloat(finalWeight),
                finalDimensions: {
                    length: parseFloat(dims.length),
                    width: parseFloat(dims.width),
                    height: parseFloat(dims.height)
                },
                finalValue: parseFloat(finalValue) || 0
            })
        });

        const data = await res.json();
        
        if (res.ok) {
            alert(`✅ ${isLocalDelivery ? 'Pallet de Aura' : 'Consolidación'} procesada. El cliente ya puede pagar.`);
            setShowModal(false);
            router.refresh(); 
        } else {
            alert("Error: " + (data.message || "Error desconocido"));
        }
    } catch (e) {
        console.error(e);
        alert("Error de conexión");
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <>
      {/* --- TARJETA VISUAL --- */}
      <div className={`rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow cursor-pointer relative ${isLocalDelivery ? 'border-gray-800 bg-gray-50' : 'border-gray-200 bg-white'}`}>
        
        {/* Cabecera Condicional según el tipo de Servicio */}
        <div className={`px-6 py-4 border-b flex flex-wrap justify-between items-center gap-4 ${isLocalDelivery ? 'bg-black text-white border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
            <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${isLocalDelivery ? 'bg-gray-800 text-white' : 'bg-blue-100 text-blue-600'}`}>
                    {request.user?.name?.[0] || 'C'}
                </div>
                <div>
                    <p className={`font-bold ${isLocalDelivery ? 'text-white' : 'text-gmc-gris-oscuro'}`}>{request.user?.name || 'Cliente'}</p>
                    <p className={`text-xs font-mono ${isLocalDelivery ? 'text-gray-400' : 'text-gray-500'}`}>STE: {request.user?.suiteNo}</p>
                </div>
            </div>
            <div className={`flex flex-col items-end text-sm ${isLocalDelivery ? 'text-gray-300' : 'text-gray-600'}`}>
                {isLocalDelivery ? (
                    <div className="flex items-center gap-1.5 font-bold text-white bg-gray-800 px-2 py-1 rounded text-xs">
                        <Truck size={14} /> LOCAL (AURA)
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 font-bold text-indigo-700 bg-indigo-100 px-2 py-1 rounded text-xs border border-indigo-200">
                        <Plane size={14} /> {request.destinationCountryCode} (AÉREO)
                    </div>
                )}
                <div className="flex items-center gap-1 mt-1 text-xs">
                    <Calendar size={12} />
                    <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        </div>

        {/* Cuerpo */}
        <div className="p-6">
            <h4 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                <Package size={14} /> {request.packages?.length || 0} Cajas a {isLocalDelivery ? 'Apilar (Pallet)' : 'Agrupar'}:
            </h4>
            
            <div className="space-y-2 mb-6 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {request.packages?.map((pkg: any) => (
                    <div key={pkg.id} className={`flex justify-between items-center p-3 rounded-lg border ${isLocalDelivery ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'}`}>
                        <div>
                            <p className="font-bold text-gmc-gris-oscuro text-sm">{pkg.description || 'Sin descripción'}</p>
                            <p className="text-xs text-gray-500 font-mono">{pkg.gmcTrackingNumber}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold">{pkg.weightLbs} Lbs</p>
                            <p className="text-xs text-gray-400">{pkg.lengthIn}x{pkg.widthIn}x{pkg.heightIn} in</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer: Botón de Acción */}
            <div className={`flex justify-end pt-4 border-t ${isLocalDelivery ? 'border-gray-200' : 'border-gray-100'}`}>
                <button 
                    onClick={(e) => {
                        e.stopPropagation(); 
                        setShowModal(true);
                    }}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 ${
                        isLocalDelivery 
                            ? 'bg-black text-white hover:bg-gray-800' 
                            : 'bg-gmc-gris-oscuro text-white hover:bg-black'
                    }`}
                >
                    {isLocalDelivery ? 'Medir Pallet Aura' : 'Procesar Consolidación'} <ArrowRight size={16} />
                </button>
            </div>
        </div>
      </div>

      {/* --- MODAL DE PROCESAMIENTO --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className={`rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 ${isLocalDelivery ? 'bg-gray-50' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className={`text-lg font-bold ${isLocalDelivery ? 'text-black' : 'text-indigo-900'}`}>
                        {isLocalDelivery ? 'Datos del Pallet' : 'Datos Finales'}
                    </h3>
                    <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400 hover:text-red-500"/></button>
                </div>

                <div className={`p-4 rounded-lg mb-4 text-xs ${isLocalDelivery ? 'bg-white border border-gray-200 text-gray-800' : 'bg-indigo-50 text-indigo-800'}`}>
                    <p>
                        {isLocalDelivery ? <Truck size={14} className="inline mr-1"/> : '📦'} 
                        Estás {isLocalDelivery ? 'preparando' : 'consolidando'} <strong>{request.packages?.length} paquetes</strong> para {isLocalDelivery ? 'AURA LOGISTICS' : 'ENVÍO INTERNACIONAL'}. Ingresa las medidas finales del bulto.
                    </p>
                </div>

                {/* Input Peso */}
                <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Peso Final (Lbs)</label>
                    <input 
                        type="number" 
                        value={finalWeight}
                        onChange={(e) => setFinalWeight(e.target.value)}
                        placeholder="Ej: 50.5"
                        className="w-full border border-gray-300 rounded-lg p-3 font-mono text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        autoFocus
                    />
                </div>

                {/* INPUT VALOR DECLARADO */}
                {!isLocalDelivery && (
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-blue-600 uppercase mb-1 flex items-center gap-1">
                            <DollarSign size={12}/> Valor Declarado Total ($)
                        </label>
                        <input 
                            type="number" 
                            value={finalValue}
                            onChange={(e) => setFinalValue(e.target.value)}
                            placeholder="0.00"
                            className="w-full border border-blue-200 bg-blue-50/30 rounded-lg p-3 font-bold text-blue-800 focus:ring-2 focus:ring-blue-500 outline-none placeholder-blue-300"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">+ Seguro (3%) si {'>'} $100</p>
                    </div>
                )}

                {/* Inputs Dimensiones */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><Ruler size={10}/> Largo</label>
                        <input type="number" placeholder="In" className="w-full border p-2 rounded-lg text-center font-mono"
                            value={dims.length} onChange={(e) => setDims({...dims, length: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Ancho</label>
                        <input type="number" placeholder="In" className="w-full border p-2 rounded-lg text-center font-mono"
                            value={dims.width} onChange={(e) => setDims({...dims, width: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Alto</label>
                        <input type="number" placeholder="In" className="w-full border p-2 rounded-lg text-center font-mono"
                            value={dims.height} onChange={(e) => setDims({...dims, height: e.target.value})} />
                    </div>
                </div>

                <button 
                    onClick={handleProcess} 
                    disabled={isSaving}
                    className={`w-full text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                        isLocalDelivery 
                            ? 'bg-black hover:bg-gray-800' 
                            : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                >
                    {isSaving ? <Loader2 className="animate-spin"/> : (isLocalDelivery ? <Truck size={18}/> : <Box size={18}/>)}
                    Guardar y Habilitar Pago
                </button>
            </div>
        </div>
      )}
    </>
  );
}