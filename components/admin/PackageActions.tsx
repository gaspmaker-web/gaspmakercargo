'use client';

import React, { useState } from 'react';
import { 
  MoreHorizontal, Edit, Truck, X, Save, Loader2, Printer, 
  Package, User, Box, Ruler, MapPin, CheckCircle, Barcode 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// ⚠️ ASEGÚRATE DE QUE ESTE ARCHIVO EXISTA O EL BUILD FALLARÁ
import EditPackageAdminModal from './EditPackageAdminModal';

interface PackageActionsProps {
  pkg: any;
  locale: string;
}

export default function PackageActions({ pkg, locale }: PackageActionsProps) {
  const router = useRouter();
  
  // Estados de UI
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // --- ESTADOS DE MODALES ---
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showConsolidateModal, setShowConsolidateModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  
  // --- ESTADOS DE PROCESO ---
  const [finalWeight, setFinalWeight] = useState('');
  const [dims, setDims] = useState({ length: '', width: '', height: '' });
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // --- ESTADOS DE ÉXITO ---
  const [dispatchSuccess, setDispatchSuccess] = useState(false);
  const [consolidateSuccess, setConsolidateSuccess] = useState(false);

  // ========================================================================
  // 🔥 LÓGICA DE VISIBILIDAD DE BOTONES
  // ========================================================================

  const isPreAlert = pkg.status === 'PRE_ALERTA';
  const isReadyToShip = pkg.status === 'EN_PROCESO_ENVIO';
  const isConsolidationRequest = pkg.status === 'EN_PROCESO_CONSOLIDACION' || pkg.status === 'SOLICITUD_CONSOLIDACION';
  
  const isGaspMaker = pkg.selectedCourier?.toUpperCase().includes('GASP') || 
                      pkg.selectedCourier?.toUpperCase().includes('MAKER');

  const isStorePickup = pkg.status === 'PENDIENTE_RETIRO' || pkg.selectedCourier === 'CLIENTE_RETIRO';

  // ========================================================================
  // 🖨️ FUNCIÓN PARA IMPRIMIR
  // ========================================================================
  const openPrintWindow = (type: '4x6' | 'mini') => {
      const format = type === 'mini' ? '30334' : '4x6';
      
      const currentTracking = (dispatchSuccess && trackingNumber) 
          ? trackingNumber 
          : (pkg.gmcTrackingNumber || pkg.gmcShipmentNumber || 'PENDING');

      const params = new URLSearchParams({
          tracking: currentTracking,
          clientName: pkg.user?.name || 'Cliente',
          suite: pkg.user?.suiteNo || 'N/A',
          weight: (pkg.weightLbs || 0).toString(),
          countryCode: pkg.user?.countryCode || 'US',
          date: new Date().toLocaleDateString(),
          description: pkg.description || 'Envío',
          format: format
      });

      const url = `/print/label?${params.toString()}`; 
      window.open(url, '_blank');
  };

  // --- LÓGICA DE CONSOLIDACIÓN (ADMIN) ---
  const handleConsolidate = async () => {
      if (!finalWeight || !dims.length || !dims.width || !dims.height) {
          return alert("Por favor ingresa el Peso y las 3 Medidas (Largo, Ancho, Alto).");
      }
      
      setIsSaving(true);
      try {
          const res = await fetch('/api/admin/consolidate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  userId: pkg.userId, 
                  finalWeight: finalWeight,
                  finalDimensions: {
                      length: dims.length,
                      width: dims.width,
                      height: dims.height
                  }
              })
          });
          
          const data = await res.json();
          if (res.ok) {
              setConsolidateSuccess(true); 
              router.refresh();
          } else {
              alert("Error: " + data.message);
          }
      } catch (e) {
          alert("Error de conexión");
      } finally {
          setIsSaving(false);
      }
  };

  // --- LÓGICA DE DESPACHO (GMC) ---
  React.useEffect(() => { 
      if (showDispatchModal && isGaspMaker && !trackingNumber) { 
          const randomNum = Math.floor(100000 + Math.random() * 900000); 
          setTrackingNumber(`GMC-DEL-${randomNum}`); 
      } 
  }, [showDispatchModal, isGaspMaker]);

  const handleDispatch = async () => { 
      if (!trackingNumber) return alert("Ingresa tracking"); 
      setIsSaving(true); 
      try { 
          const res = await fetch('/api/packages/dispatch', { 
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' }, 
              body: JSON.stringify({ packageId: pkg.id, finalTrackingNumber: trackingNumber }) 
          }); 
          
          if (res.ok) { 
              setDispatchSuccess(true); 
              router.refresh(); 
          } else { 
              alert("Error."); 
          } 
      } catch (e) { 
          alert("Error conexión"); 
      } finally { 
          setIsSaving(false); 
      } 
  };

  const handlePickupStore = async () => {
      if (!confirm(`¿Confirmas que el cliente retiró el paquete ${pkg.gmcTrackingNumber}?`)) return;
      try {
          const res = await fetch('/api/admin/packages/update-status', { 
              method: 'POST', headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ packageId: pkg.id, newStatus: 'ENTREGADO' })
          });
          if (res.ok) { alert("✅ Entregado en Tienda."); setIsMenuOpen(false); router.refresh(); }
      } catch (e) { alert("Error al entregar."); }
  };

  const handleBuyLabel = async () => { 
      if (!confirm(`¿Comprar Label?`)) return; 
      setIsSaving(true); 
      try { 
          const res = await fetch('/api/packages/buy-label', { 
              method: 'POST', headers: { 'Content-Type': 'application/json' }, 
              body: JSON.stringify({ packageId: pkg.id }) 
          }); 
          const data = await res.json(); 
          if (res.ok) { alert(`✅ Label: ${data.tracking}`); router.refresh(); } 
          else { alert(`Error: ${data.error}`); } 
      } catch (e) { alert("Error EasyPost"); } 
      finally { setIsSaving(false); } 
  };

  // --- COMPONENTE REUTILIZABLE: BOTONES DE IMPRESIÓN ---
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
    <div className="relative flex justify-end">
      <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
        <MoreHorizontal size={20} />
      </button>

      {isMenuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden font-montserrat animate-in fade-in zoom-in-95 duration-100 text-sm">
            
            {/* 1. EDITAR */}
            <button onClick={() => { setIsEditOpen(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-gray-700">
              <Edit size={16} className="text-gray-400" /> Editar Detalles
            </button>
            
            {/* 2. IMPRIMIR (Menú Principal) */}
            <button onClick={() => { setShowPrintModal(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-gray-700">
              <Printer size={16} className="text-gray-400" /> Imprimir Etiqueta
            </button>

            <Link href={`/${locale}/dashboard-admin/clientes/${pkg.user?.id}`} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-gray-700">
               <User size={16} className="text-gray-400" /> Ver Perfil Cliente
            </Link>

            {/* CONSOLIDAR */}
            {isConsolidationRequest && (
                 <button 
                    onClick={() => { setShowConsolidateModal(true); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 bg-indigo-50 hover:bg-indigo-100 flex items-center gap-3 font-bold text-indigo-800 border-t border-indigo-100"
                >
                    <Box size={16} /> Procesar Consolidación
                </button>
            )}

            {/* PRE-ALERTA */}
            {isPreAlert && (
                 <Link href={`/${locale}/dashboard-admin/paquetes/${pkg.id}`} className="w-full text-left px-4 py-3 bg-yellow-50 hover:bg-yellow-100 flex items-center gap-3 font-bold text-yellow-800 border-t border-gray-100">
                    <Package size={16} /> Procesar Ingreso
                </Link>
            )}

            {/* DESPACHAR / API */}
            {isReadyToShip && (
                <>
                {!isGaspMaker && (
                    <button onClick={handleBuyLabel} disabled={isSaving} className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 flex items-center gap-3 font-bold text-purple-700 border-t border-gray-100">
                        <Printer size={16} /> Comprar Label (API)
                    </button>
                )}
                <button onClick={() => { setShowDispatchModal(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-green-50 flex items-center gap-3 font-bold text-green-700">
                    <Truck size={16} /> {isGaspMaker ? "Despachar (GMC)" : "Tracking Manual"}
                </button>
                </>
            )}

            {isStorePickup && (
                <>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button onClick={handlePickupStore} className="w-full text-left px-4 py-3 hover:bg-green-50 flex items-center gap-3 text-green-700 font-bold transition-colors">
                        <MapPin size={16}/> Entregar en Tienda
                    </button>
                </>
            )}

          </div>
        </>
      )}

      {/* --- MODAL SOLO IMPRIMIR (Desde el menú) --- */}
      {showPrintModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Printer size={20}/> Imprimir Etiqueta
                    </h3>
                    <button onClick={() => setShowPrintModal(false)}><X size={20} className="text-gray-400"/></button>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg mb-4 text-center">
                    <p className="text-sm text-gray-500">Tracking:</p>
                    <p className="font-mono font-bold text-lg text-gray-800">{pkg.gmcTrackingNumber || pkg.gmcShipmentNumber}</p>
                </div>
                <PrintButtons />
            </div>
          </div>
      )}

      {/* --- MODAL CONSOLIDACIÓN --- */}
      {showConsolidateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-indigo-900">
                        {consolidateSuccess ? '¡Consolidación Exitosa!' : 'Datos de Consolidación'}
                    </h3>
                    <button onClick={() => setShowConsolidateModal(false)}><X size={20} className="text-gray-400 hover:text-red-500"/></button>
                </div>

                {consolidateSuccess ? (
                    <div className="text-center">
                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-3">
                            <CheckCircle size={32}/>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            El paquete ha sido consolidado. Imprime la etiqueta ahora.
                        </p>
                        <PrintButtons />
                        <button onClick={() => setShowConsolidateModal(false)} className="mt-4 text-xs text-gray-400 hover:text-gray-600">
                            Cerrar
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="bg-indigo-50 p-4 rounded-lg mb-4 text-xs text-indigo-800">
                            <p>Ingresa las medidas finales de la caja consolidada.</p>
                        </div>

                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Peso Final (Lbs)</label>
                        <input type="number" value={finalWeight} onChange={(e) => setFinalWeight(e.target.value)} placeholder="Ej: 70" className="w-full border border-gray-300 rounded-lg p-3 font-mono text-lg mb-4 focus:ring-2 focus:ring-indigo-500 outline-none" autoFocus />

                        <div className="grid grid-cols-3 gap-2 mb-6">
                            <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Largo</label><input type="number" placeholder="In" className="w-full border p-2 rounded-lg text-center" value={dims.length} onChange={(e) => setDims({...dims, length: e.target.value})}/></div>
                            <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Ancho</label><input type="number" placeholder="In" className="w-full border p-2 rounded-lg text-center" value={dims.width} onChange={(e) => setDims({...dims, width: e.target.value})}/></div>
                            <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Alto</label><input type="number" placeholder="In" className="w-full border p-2 rounded-lg text-center" value={dims.height} onChange={(e) => setDims({...dims, height: e.target.value})}/></div>
                        </div>

                        <button onClick={handleConsolidate} disabled={isSaving} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all">
                            {isSaving ? <Loader2 className="animate-spin"/> : <Box size={18}/>} Guardar y Habilitar Pago
                        </button>
                    </>
                )}
            </div>
        </div>
      )}

      {/* 🛑 AQUI USAMOS EL MODAL DE EDICIÓN (DEBE EXISTIR) */}
      {isEditOpen && <EditPackageAdminModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} pkg={pkg} />}
      
      {/* --- MODAL DESPACHO --- */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">
                        {dispatchSuccess ? '¡Despacho Exitoso!' : (isGaspMaker ? "Despacho GMC" : "Tracking Manual")}
                    </h3>
                    <button onClick={() => setShowDispatchModal(false)}><X size={20} className="text-gray-400"/></button>
                </div>

                {dispatchSuccess ? (
                    <div className="text-center">
                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-3">
                            <CheckCircle size={32}/>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Tracking Generado:</p>
                        <p className="font-mono font-bold text-xl text-blue-600 mb-6 bg-blue-50 p-2 rounded">{trackingNumber}</p>
                        
                        <PrintButtons />
                        
                        <button onClick={() => setShowDispatchModal(false)} className="mt-4 text-xs text-gray-400 hover:text-gray-600">
                            Cerrar
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm"><p className="font-bold text-blue-800">{pkg.selectedCourier}</p></div>
                        <input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Tracking..." className="w-full border p-3 rounded-lg mb-4 font-mono text-lg"/>
                        <button onClick={handleDispatch} disabled={isSaving} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex gap-2 justify-center">
                            {isSaving ? <Loader2 className="animate-spin"/> : <Save size={18}/>} Guardar
                        </button>
                    </>
                )}
            </div>
        </div>
      )}
    </div>
  );
}