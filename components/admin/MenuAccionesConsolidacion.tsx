'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  MoreHorizontal, Truck, X, Save, Loader2, Printer, 
  CheckCircle, Barcode, Edit, User, Send, FileText 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Props {
  shipment: any; 
}

export default function MenuAccionesConsolidacion({ shipment }: Props) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // --- Estados del Modal ---
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 🕵️ DETECCIÓN INTELIGENTE
  const courier = shipment.selectedCourier;
  const isGMC = courier?.toLowerCase().includes('gasp') || courier?.toLowerCase().includes('gmc');

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Generar tracking automático
  useEffect(() => {
      if (showDispatchModal && !trackingNumber && isGMC) {
          const randomNum = Math.floor(100000 + Math.random() * 900000);
          setTrackingNumber(`GMC-SHIP-${randomNum}`);
      }
  }, [showDispatchModal, isGMC]);

  // --- LÓGICA DE DESPACHO ---
  const handleDispatch = async () => {
      if (!trackingNumber) return alert("Falta el número de tracking.");
      setIsSaving(true);

      try {
          const res = await fetch('/api/packages/dispatch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  packageId: shipment.id, 
                  finalTrackingNumber: trackingNumber,
                  type: 'CONSOLIDATION' 
              })
          });

          if (res.ok) {
              // ✅ ÉXITO: Solo cambiamos el estado visual.
              // ❌ NO HACEMOS router.refresh() AQUÍ para que el modal no se cierre solo.
              setDispatchSuccess(true); 
          } else {
              alert("Error al despachar.");
          }
      } catch (error) {
          alert("Error de conexión");
      } finally {
          setIsSaving(false);
      }
  };

  // --- AL CERRAR EL MODAL DE ÉXITO ---
  const handleCloseSuccess = () => {
      setShowDispatchModal(false);
      // 🔥 AHORA SÍ REFRESCAMOS LA PÁGINA
      // El usuario ya imprimió y decidió cerrar.
      router.refresh(); 
  };

  // --- LÓGICA DE IMPRESIÓN ---
  const openPrintWindow = (type: '4x6' | 'mini') => {
      const format = type === 'mini' ? '30334' : '4x6';
      
      const currentTracking = (dispatchSuccess && trackingNumber) 
          ? trackingNumber 
          : (shipment.finalTrackingNumber || shipment.gmcShipmentNumber || 'PENDING');

      const params = new URLSearchParams({
          tracking: currentTracking,
          clientName: shipment.user?.name || 'Cliente',
          suite: shipment.user?.suiteNo || 'N/A',
          weight: (shipment.weightLbs || 0).toString(),
          countryCode: shipment.user?.countryCode || 'US',
          date: new Date().toLocaleDateString(),
          description: 'Consolidación',
          format: format
      });

      const url = `/print/label?${params.toString()}`;
      window.open(url, '_blank');
  };

  const PrintButtons = () => (
      <div className="flex gap-3 mt-4 animate-in fade-in zoom-in-95">
          <button 
              onClick={() => openPrintWindow('4x6')}
              className="flex-1 bg-slate-800 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors"
          >
              <Printer size={18}/> Etiqueta 4x6"
          </button>
          <button 
              onClick={() => openPrintWindow('mini')}
              className="flex-1 bg-white border-2 border-slate-200 text-slate-700 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
          >
              <Barcode size={18}/> Barcode Mini
          </button>
      </div>
  );

  return (
    <div className="relative" ref={menuRef}>
      
      <button 
        onClick={() => setShowMenu(!showMenu)} 
        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
      >
        <MoreHorizontal size={20} />
      </button>

      {/* --- MENÚ DESPLEGABLE --- */}
      {showMenu && (
        <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden font-montserrat animate-in fade-in zoom-in-95 duration-100 text-sm">
            <div className="py-1">
                <button className="w-full text-left px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                    <FileText size={16} /> Editar Detalles
                </button>
                
                <Link href={`/dashboard-admin/clientes/${shipment.user?.id}`} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-gray-700">
                    <User size={16} /> Ver Perfil Cliente
                </Link>

                <div className="border-t border-gray-100 my-1"></div>

                <button 
                    onClick={() => { setShowDispatchModal(true); setShowMenu(false); }}
                    className={`w-full text-left px-4 py-3 flex items-center gap-2 font-bold transition-colors ${isGMC ? 'text-green-700 bg-green-50 hover:bg-green-100' : 'text-blue-700 bg-blue-50 hover:bg-blue-100'}`}
                >
                    {isGMC ? <Truck size={16} /> : <Send size={16}/>} 
                    {isGMC ? 'Despachar (GMC)' : 'Tracking Manual'}
                </button>
            </div>
        </div>
      )}

      {/* --- MODAL DE DESPACHO --- */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
                
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">
                        {dispatchSuccess ? '¡Despacho Confirmado!' : (isGMC ? 'Confirmar Despacho GMC' : 'Tracking Manual')}
                    </h3>
                    {/* Botón X cierra y refresca si ya hubo éxito */}
                    <button onClick={dispatchSuccess ? handleCloseSuccess : () => setShowDispatchModal(false)}>
                        <X size={20} className="text-gray-400 hover:text-red-500"/>
                    </button>
                </div>

                {dispatchSuccess ? (
                    // ✅ VISTA DE ÉXITO (SE QUEDA ABIERTA HASTA QUE ELIJAS CERRAR)
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4 animate-bounce-slow">
                            <CheckCircle size={32}/>
                        </div>
                        <p className="text-gray-600 mb-2">Se ha generado el tracking:</p>
                        <div className="bg-gray-100 p-3 rounded-lg font-mono font-bold text-xl text-gray-800 mb-6 border border-gray-200 select-all">
                            {trackingNumber}
                        </div>
                        
                        <p className="text-xs text-gray-400 mb-2 uppercase font-bold">Imprimir Etiqueta de Salida</p>
                        <PrintButtons />

                        <button onClick={handleCloseSuccess} className="mt-6 text-sm text-gray-400 hover:text-gray-600 underline">
                            Cerrar y Actualizar
                        </button>
                    </div>
                ) : (
                    // 📝 VISTA DE CONFIRMACIÓN
                    <>
                        <div className="bg-blue-50/50 p-3 rounded-lg flex justify-between items-center mb-6 border border-blue-100">
                             <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Courier</span>
                             <span className="px-3 py-1 rounded text-sm font-bold shadow-sm border bg-white text-blue-900 border-blue-100">
                                {courier || 'NO DEFINIDO'}
                             </span>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tracking Number</label>
                            <input 
                                type="text" 
                                value={trackingNumber} 
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                placeholder="Escanea o escribe..."
                                className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-lg p-3 font-mono text-lg text-gray-800 outline-none transition-colors"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowDispatchModal(false)}
                                className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-600 font-bold hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleDispatch}
                                disabled={isSaving}
                                className={`flex-1 py-3 rounded-lg text-white font-bold flex justify-center items-center gap-2 shadow-lg ${isGMC ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
                            >
                                {isSaving ? <Loader2 className="animate-spin"/> : <Save size={18}/>}
                                {isGMC ? 'Confirmar Salida' : 'Guardar Tracking'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
      )}
    </div>
  );
}