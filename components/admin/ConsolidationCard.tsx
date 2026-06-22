'use client';

import React, { useState, useEffect } from 'react';
import { Package, MapPin, Calendar, ArrowRight, X, Loader2, Box, Ruler, DollarSign, Truck, Plane, Ship, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ConsolidationCard({ request }: { request: any }) {
  const router = useRouter();
  
  // Estado del Modal
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // =================================================================
  // ✈️ ESTADO PARA AÉREO Y MARÍTIMO (Flujo Internacional)
  // =================================================================
  const [finalWeight, setFinalWeight] = useState('');
  const [dims, setDims] = useState({ length: '', width: '', height: '' });
  const [finalValue, setFinalValue] = useState('');

  // =================================================================
  // 🔥 ESTADO PARA CARGOS ESPECIALES (HAZMAT Y EEI)
  // =================================================================
  const [specialCharges, setSpecialCharges] = useState({
      hazmatPrepFee: false,
      hazmatShippingLineFee: false,
      airHazmat: false,
      eei: false
  });

  const toggleCharge = (charge: keyof typeof specialCharges) => {
      setSpecialCharges(prev => ({ ...prev, [charge]: !prev[charge] }));
  };

  // Lógica Automática EEI: Si supera $2,500, se marca el Trámite EEI
  useEffect(() => {
      if (parseFloat(finalValue || '0') > 2500) {
          setSpecialCharges(prev => ({ ...prev, eei: true }));
      } else {
          setSpecialCharges(prev => ({ ...prev, eei: false }));
      }
  }, [finalValue]);

  // =================================================================
  // 🚚 ESTADO PARA LOCAL DELIVERY (Aura Inteligencia - Filas Dinámicas)
  // =================================================================
  const [auraPieces, setAuraPieces] = useState([
    { weight: '', length: '', width: '', height: '' }
  ]);

  const isLocalDelivery = request.serviceType === 'LOCAL_DELIVERY';
  const isOcean = request.serviceType === 'OCEAN_CONSOLIDATION';

  // --- Funciones para manejar las filas de Aura ---
  const handleAddPiece = () => {
    setAuraPieces([...auraPieces, { weight: '', length: '', width: '', height: '' }]);
  };

  const handleRemovePiece = (index: number) => {
    const newPieces = auraPieces.filter((_, i) => i !== index);
    setAuraPieces(newPieces);
  };

  const handlePieceChange = (index: number, field: string, value: string) => {
    const newPieces = [...auraPieces];
    (newPieces[index] as any)[field] = value;
    setAuraPieces(newPieces);
  };

  // --- Procesamiento al Backend ---
  const handleProcess = async () => {
    setIsSaving(true);
    try {
        let payload: any = { 
            consolidationId: request.id,
            isAura: isLocalDelivery,
            // 🔥 ENVIAMOS LOS CARGOS ESPECIALES AL BACKEND
            extraCharges: specialCharges 
        };

        if (isLocalDelivery) {
            // Validación Aura
            const isIncomplete = auraPieces.some(p => !p.weight || !p.length || !p.width || !p.height);
            if (isIncomplete) {
                setIsSaving(false);
                return alert("⚠️ Por favor completa el Peso y las 3 Medidas en todas las filas de Aura.");
            }

            // Mapeamos y calculamos el Billable Weight individual de una vez para facilitar al backend
            payload.auraPieces = auraPieces.map(p => {
                const w = parseFloat(p.weight);
                const l = parseFloat(p.length);
                const wd = parseFloat(p.width);
                const h = parseFloat(p.height);
                const volWeight = (l * wd * h) / 166;
                
                return {
                    weight: w,
                    length: l,
                    width: wd,
                    height: h,
                    billableWeight: Math.max(w, volWeight) // 👈 El divisor 166 de Aura
                };
            });
            payload.distanceMiles = request.user?.distanceMiles || 0;

        } else {
            // Validación Aéreo / Marítimo
            if (!finalWeight || !dims.length || !dims.width || !dims.height) {
                setIsSaving(false);
                return alert("⚠️ Por favor ingresa el Peso y las 3 Medidas reales de la carga.");
            }
            payload.finalWeight = parseFloat(finalWeight);
            payload.finalDimensions = {
                length: parseFloat(dims.length),
                width: parseFloat(dims.width),
                height: parseFloat(dims.height)
            };
            payload.finalValue = parseFloat(finalValue) || 0;
        }

        const res = await fetch('/api/admin/consolidate-confirm', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        
        if (res.ok) {
            alert(`✅ Consolidación procesada. ${isLocalDelivery ? 'Aura calculó la tarifa exacta por bultos.' : 'El cliente ya puede pagar.'}`);
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
      {/* TARJETA PRINCIPAL */}
      <div className={`rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow cursor-pointer relative ${
          isLocalDelivery ? 'border-gray-800 bg-gray-50' : isOcean ? 'border-blue-200 bg-blue-50/20' : 'border-gray-200 bg-white'
      }`}>
        <div className={`px-6 py-4 border-b flex flex-wrap justify-between items-center gap-4 ${
            isLocalDelivery ? 'bg-black text-white border-gray-800' : isOcean ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'
        }`}>
            <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
                    isLocalDelivery ? 'bg-gray-800 text-white' : isOcean ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
                }`}>
                    {request.user?.name?.[0] || 'C'}
                </div>
                <div>
                    <p className={`font-bold ${isLocalDelivery ? 'text-white' : 'text-gmc-gris-oscuro'}`}>{request.user?.name || 'Cliente'}</p>
                    <p className={`text-xs font-mono ${isLocalDelivery ? 'text-gray-400' : 'text-gray-500'}`}>STE: {request.user?.suiteNo}</p>
                </div>
            </div>
            
            {/* BADGES VISUALES DEL TIPO DE SERVICIO */}
            <div className={`flex flex-col items-end text-sm ${isLocalDelivery ? 'text-gray-300' : 'text-gray-600'}`}>
                {isLocalDelivery ? (
                    <div className="flex items-center gap-1.5 font-bold text-white bg-gray-800 px-2 py-1 rounded text-xs">
                        <Truck size={14} /> LOCAL (AURA)
                    </div>
                ) : isOcean ? (
                    <div className="flex items-center gap-1.5 font-bold text-white bg-blue-600 px-2 py-1 rounded text-xs shadow-sm border border-blue-700">
                        <Ship size={14} /> {request.destinationCountryCode || 'DESTINO'} (MARÍTIMO)
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 font-bold text-indigo-700 bg-indigo-100 px-2 py-1 rounded text-xs border border-indigo-200">
                        <Plane size={14} /> {request.destinationCountryCode || 'DESTINO'} (AÉREO)
                    </div>
                )}
                
                <div className="flex items-center gap-1 mt-1 text-xs">
                    <Calendar size={12} />
                    <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        </div>

        <div className="p-6">
            <h4 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                <Package size={14} /> {request.packages?.length || 0} Cajas a {isLocalDelivery ? 'Armar (Pallet)' : 'Agrupar'}:
            </h4>
            
            <div className="space-y-2 mb-6 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {request.packages?.map((pkg: any) => (
                    <div key={pkg.id} className={`flex justify-between items-center p-3 rounded-lg border ${
                        isLocalDelivery ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
                    }`}>
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

            <div className={`flex justify-end pt-4 border-t ${isLocalDelivery ? 'border-gray-200' : 'border-gray-100'}`}>
                <button 
                    onClick={(e) => {
                        e.stopPropagation(); 
                        setShowModal(true);
                    }}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 ${
                        isLocalDelivery 
                            ? 'bg-black text-white hover:bg-gray-800' 
                            : isOcean
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                >
                    {isLocalDelivery ? 'Medir Pallet Aura' : isOcean ? 'Procesar Marítimo' : 'Procesar Aéreo'} <ArrowRight size={16} />
                </button>
            </div>
        </div>
      </div>

      {/* --- MODAL DE PROCESAMIENTO --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            {/* 🔥 Aumentamos el max-w-sm a max-w-md y pusimos overflow-y-auto para evitar recortes */}
            <div className={`rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[95vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 ${isLocalDelivery ? 'bg-gray-50' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className={`text-lg font-bold flex items-center gap-2 ${
                        isLocalDelivery ? 'text-black' : isOcean ? 'text-blue-900' : 'text-indigo-900'
                    }`}>
                        {isLocalDelivery ? <><Box size={20}/> Datos del Pallet</> : isOcean ? <><Ship size={20}/> Datos Marítimos</> : 'Datos Finales'}
                    </h3>
                    <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400 hover:text-red-500"/></button>
                </div>

                <div className={`p-4 rounded-lg mb-4 text-xs border ${
                    isLocalDelivery 
                        ? 'bg-white border-gray-200 text-gray-800' 
                        : isOcean 
                        ? 'bg-blue-50 border-blue-100 text-blue-800' 
                        : 'bg-indigo-50 border-indigo-100 text-indigo-800'
                }`}>
                    <p>
                        {isLocalDelivery ? <Truck size={14} className="inline mr-1"/> : isOcean ? <Ship size={14} className="inline mr-1"/> : '📦 '} 
                        Estás preparando <strong>{request.packages?.length} paquetes</strong> para {
                            isLocalDelivery ? 'AURA LOGISTICS' : isOcean ? 'ENVÍO MARÍTIMO (OCEAN)' : 'ENVÍO INTERNACIONAL (AIR)'
                        }. Ingresa las medidas finales.
                    </p>
                </div>

                {/* ============================================================== */}
                {/* 🚚 INTERFAZ DINÁMICA AURA (LOCAL DELIVERY)                     */}
                {/* ============================================================== */}
                {isLocalDelivery ? (
                    <div className="max-h-64 overflow-y-auto pr-1 mb-4 space-y-3 custom-scrollbar">
                        {auraPieces.map((piece, index) => (
                            <div key={index} className="bg-white p-3 rounded-xl border border-gray-300 relative shadow-sm">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs font-bold text-gray-800 uppercase bg-gray-100 px-2 py-1 rounded">
                                        Pallet / Bulto {index + 1}
                                    </span>
                                    {index > 0 && (
                                        <button onClick={() => handleRemovePiece(index)} className="text-red-400 hover:text-red-600 transition-colors">
                                            <Trash2 size={16}/>
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Lbs</label>
                                        <input type="number" placeholder="0" className="w-full border border-gray-300 p-2 rounded-lg text-center font-mono text-sm focus:ring-2 focus:ring-black outline-none"
                                            value={piece.weight} onChange={(e) => handlePieceChange(index, 'weight', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><Ruler size={10}/> L</label>
                                        <input type="number" placeholder="In" className="w-full border border-gray-200 p-2 rounded-lg text-center font-mono text-sm focus:ring-2 focus:ring-black outline-none"
                                            value={piece.length} onChange={(e) => handlePieceChange(index, 'length', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">W</label>
                                        <input type="number" placeholder="In" className="w-full border border-gray-200 p-2 rounded-lg text-center font-mono text-sm focus:ring-2 focus:ring-black outline-none"
                                            value={piece.width} onChange={(e) => handlePieceChange(index, 'width', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">H</label>
                                        <input type="number" placeholder="In" className="w-full border border-gray-200 p-2 rounded-lg text-center font-mono text-sm focus:ring-2 focus:ring-black outline-none"
                                            value={piece.height} onChange={(e) => handlePieceChange(index, 'height', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        <button 
                            onClick={handleAddPiece}
                            className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl hover:border-black hover:text-black transition-colors flex justify-center items-center gap-2 text-xs font-bold uppercase"
                        >
                            <Plus size={16} /> Agregar Pallet / Bulto Adicional
                        </button>
                    </div>
                ) : (
                /* ============================================================== */
                /* ✈️/🚢 INTERFAZ ESTÁTICA ORIGINAL (AÉREO Y MARÍTIMO)             */
                /* ============================================================== */
                    <>
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Peso Final (Lbs)</label>
                            <input 
                                type="number" 
                                value={finalWeight}
                                onChange={(e) => setFinalWeight(e.target.value)}
                                placeholder="Ej: 50.5"
                                className={`w-full border rounded-lg p-3 font-mono text-lg outline-none focus:ring-2 ${
                                    isOcean ? 'border-blue-300 focus:ring-blue-500' : 'border-gray-300 focus:ring-indigo-500'
                                }`}
                            />
                        </div>

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
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-4">
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
                    </>
                )}

                {/* ============================================================== */}
                {/* 🔥 NUEVO PANEL: CARGOS ESPECIALES Y HAZMAT 🔥                  */}
                {/* ============================================================== */}
                <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-200 mb-4 overflow-hidden shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle size={16} className="text-orange-500" />
                        <label className="text-xs font-bold text-orange-800 uppercase tracking-wider">
                            Cargos Especiales y Hazmat
                        </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Hazmat Preparation Fee */}
                        <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${specialCharges.hazmatPrepFee ? 'bg-orange-100 border-orange-400' : 'bg-white border-orange-100 hover:bg-orange-50'}`}>
                            <input type="checkbox" checked={specialCharges.hazmatPrepFee} onChange={() => toggleCharge('hazmatPrepFee')} className="w-4 h-4 text-orange-600 rounded shrink-0" />
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold text-gray-800 uppercase leading-tight truncate">HAZMAT PREP FEE</p>
                                <p className="text-[10px] text-orange-600 font-bold mt-0.5">+$120.00</p>
                            </div>
                        </label>

                        {/* Hazmat Shipping Line Fee */}
                        <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${specialCharges.hazmatShippingLineFee ? 'bg-orange-100 border-orange-400' : 'bg-white border-orange-100 hover:bg-orange-50'}`}>
                            <input type="checkbox" checked={specialCharges.hazmatShippingLineFee} onChange={() => toggleCharge('hazmatShippingLineFee')} className="w-4 h-4 text-orange-600 rounded shrink-0" />
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold text-gray-800 uppercase leading-tight truncate">SHIPPING LINE FEE</p>
                                <p className="text-[10px] text-orange-600 font-bold mt-0.5">+$180.00</p>
                            </div>
                        </label>

                        {/* Air Hazmat Compliance */}
                        <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all sm:col-span-2 ${specialCharges.airHazmat ? 'bg-orange-100 border-orange-400' : 'bg-white border-orange-100 hover:bg-orange-50'}`}>
                            <input type="checkbox" checked={specialCharges.airHazmat} onChange={() => toggleCharge('airHazmat')} className="w-4 h-4 text-orange-600 rounded shrink-0" />
                            <div>
                                <p className="text-[10px] font-bold text-gray-800 uppercase leading-tight">AIR HAZMAT COMPLIANCE</p>
                                <p className="text-[10px] text-orange-600 font-bold mt-0.5">+$275.00</p>
                            </div>
                        </label>

                        {/* Trámite EEI */}
                        <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all sm:col-span-2 ${specialCharges.eei ? 'bg-blue-100 border-blue-400' : 'bg-white border-blue-100 hover:bg-blue-50'}`}>
                            <input type="checkbox" checked={specialCharges.eei} onChange={() => toggleCharge('eei')} className="w-4 h-4 text-blue-600 rounded shrink-0" />
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-bold text-gray-800 uppercase leading-tight">Trámite EEI (Aduana)</p>
                                    {specialCharges.eei && parseFloat(finalValue || '0') > 2500 && (
                                        <span className="text-[8px] bg-blue-500 text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Auto</span>
                                    )}
                                </div>
                                <p className="text-[10px] text-blue-600 font-bold mt-0.5">+$40.00</p>
                            </div>
                        </label>
                    </div>
                </div>

                <button 
                    onClick={handleProcess} 
                    disabled={isSaving}
                    className={`w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all mt-2 shadow-md ${
                        isLocalDelivery 
                            ? 'bg-black hover:bg-gray-800' 
                            : isOcean
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                >
                    {isSaving ? <Loader2 className="animate-spin"/> : (isLocalDelivery ? <Truck size={18}/> : isOcean ? <Ship size={18}/> : <Plane size={18}/>)}
                    Guardar y Habilitar Pago
                </button>
            </div>
        </div>
      )}
    </>
  );
}