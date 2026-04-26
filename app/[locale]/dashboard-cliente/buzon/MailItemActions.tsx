"use client";

import React, { useState, useRef } from 'react';
import { FileText, Trash2, Loader2, Clock, CheckCircle2, PackagePlus, Plane, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface Props {
  mailItemId: string;
  currentStatus: string;
  isPremium?: boolean; 
  hasFreeScansLeft?: boolean;
}

export default function MailItemActions({ mailItemId, currentStatus, isPremium = false, hasFreeScansLeft = false }: Props) {
  const router = useRouter();
  const t = useTranslations('Buzon'); 
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // 🔥 NUEVO ESTADO PARA EL MODAL PERSONALIZADO
  const [showModal, setShowModal] = useState<'SCAN' | 'SHRED' | 'MOVE_TO_CARGO' | null>(null);

  // 🔥 ESCUDO ANTI-DOBLE-CLIC (Cerrojo Síncrono)
  const isProcessingRef = useRef(false);

  const confirmAndExecuteAction = async () => {
    if (!showModal) return;
    
    // 🛡️ ESCUDO: Si ya se está procesando, cancelamos cualquier clic extra
    if (isProcessingRef.current) return;

    // 🔒 CERRAMOS EL CERROJO: Bloqueo inmediato
    isProcessingRef.current = true;
    
    const actionToExecute = showModal;
    setShowModal(null); // Cerramos el modal inmediatamente
    setLoadingAction(actionToExecute);
    
    try {
      const res = await fetch('/api/mailbox/item-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mailItemId, action: actionToExecute }),
      });

      if (res.ok) {
        router.refresh(); 
      } else {
        alert(t('alertError'));
      }
    } catch (error) {
      alert(t('alertConnection'));
    } finally {
      // 🔓 ABRIMOS EL CERROJO: Liberamos para la siguiente acción
      setLoadingAction(null);
      isProcessingRef.current = false;
    }
  };

  // 🟡 ESTADO: Petición de Escaneo en proceso
  if (currentStatus === 'SCAN_REQUESTED') {
    return (
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 flex items-center gap-1.5">
            <Clock size={14} className="animate-pulse"/> {t('scanInProgress')}
        </span>
    );
  }

  // 🔴 ESTADO: Petición de Destrucción en proceso
  if (currentStatus === 'SHRED_REQUESTED') {
    return (
        <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 flex items-center gap-1.5">
            <Clock size={14} className="animate-pulse"/> {t('shredInProgress')}
        </span>
    );
  }

  // 🟣 ESTADO: Petición de Mover a Carga en proceso
  if (currentStatus === 'CARGO_REQUESTED') {
    return (
        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 flex items-center gap-1.5">
            <Clock size={14} className="animate-pulse"/> {t('cargoInProgress')}
        </span>
    );
  }

  // ⚫ ESTADO: Ya fue destruido
  if (currentStatus === 'SHREDDED') {
    return (
        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-1.5">
            <CheckCircle2 size={14} /> {t('envelopeDestroyed')}
        </span>
    );
  }

  // ✈️ ESTADO: Ya fue convertido a paquete
  if (currentStatus === 'MOVED_TO_CARGO') {
    return (
        <span className="text-xs font-bold text-purple-700 bg-purple-100 px-3 py-1.5 rounded-lg border border-purple-200 flex items-center gap-1.5">
            <Plane size={14} /> {t('movedToCargoStatus')}
        </span>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        
        {/* 🔵 BOTÓN ESCANEAR */}
        {currentStatus === 'UNREAD' && (
          <button 
            onClick={() => setShowModal('SCAN')}
            disabled={loadingAction !== null}
            className="px-3 py-2 text-sm text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-colors font-bold flex items-center gap-2 disabled:opacity-50 border border-blue-200 shadow-sm active:scale-95 group" 
            title={t('titleScan')}
          >
            {loadingAction === 'SCAN' ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
            <span className="hidden sm:flex items-center gap-1.5">
              {t('btnScan')}
              {hasFreeScansLeft ? (
                  <span className="bg-green-100 text-green-700 border border-green-300 px-1.5 py-0.5 rounded text-[10px] uppercase font-black group-hover:bg-white group-hover:text-blue-600 transition-colors">Free</span>
              ) : (
                  <span className="opacity-75 font-mono">($1.50)</span>
              )}
            </span>
          </button>
        )}

        {/* 📦 BOTÓN ENVIAR A CARGA */}
        {(currentStatus === 'UNREAD' || currentStatus === 'SCANNED_READY') && (
          <button 
            onClick={() => setShowModal('MOVE_TO_CARGO')}
            disabled={loadingAction !== null}
            className="px-3 py-2 text-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-xl transition-colors font-bold flex items-center gap-2 disabled:opacity-50 border border-indigo-200 shadow-sm active:scale-95 group" 
            title={t('titleCargo')}
          >
            {loadingAction === 'MOVE_TO_CARGO' ? <Loader2 size={16} className="animate-spin" /> : <PackagePlus size={16} />}
            <span className="hidden sm:flex items-center gap-1.5">
              {t('moveToCargo')}
              <span className="bg-green-100 text-green-700 border border-green-300 px-1.5 py-0.5 rounded text-[10px] uppercase font-black group-hover:bg-white group-hover:text-indigo-600 transition-colors">Free</span>
            </span>
          </button>
        )}
        
        {/* 🔴 BOTÓN TRITURAR */}
        {(currentStatus === 'UNREAD' || currentStatus === 'SCANNED_READY') && (
          <button 
            onClick={() => setShowModal('SHRED')}
            disabled={loadingAction !== null}
            className="px-3 py-2 text-sm text-red-700 bg-red-50 hover:bg-red-600 hover:text-white rounded-xl transition-colors font-bold flex items-center gap-2 disabled:opacity-50 border border-red-200 shadow-sm active:scale-95 group" 
            title={t('titleShred')}
          >
            {loadingAction === 'SHRED' ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            <span className="hidden sm:flex items-center gap-1.5">
              {t('destroy')}
              {isPremium ? (
                  <span className="bg-green-100 text-green-700 border border-green-300 px-1.5 py-0.5 rounded text-[10px] uppercase font-black group-hover:bg-white group-hover:text-red-600 transition-colors">Free</span>
              ) : (
                  <span className="opacity-75 font-mono">($0.50)</span>
              )}
            </span>
          </button>
        )}
      </div>

      {/* 🔥 MODALES PERSONALIZADOS ESTILO ENTERPRISE */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-auto transform transition-all animate-in zoom-in-95 duration-200">
            
            {showModal === 'SHRED' && (
              <>
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-5 mx-auto border border-red-100">
                  <AlertTriangle className="text-red-500" size={32} strokeWidth={2} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Permanent Destruction</h3>
                <p className="text-gray-500 text-sm text-center mb-8 leading-relaxed">
                  {t('confirmShred')} {/* O tu propio texto: Are you sure you want to PERMANENTLY SHRED AND DESTROY this envelope? */}
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setShowModal(null)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button onClick={confirmAndExecuteAction} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-sm">
                    Yes, Destroy
                  </button>
                </div>
              </>
            )}

            {showModal === 'SCAN' && (
              <>
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-5 mx-auto border border-blue-100">
                  <FileText className="text-blue-500" size={32} strokeWidth={2} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Request Scan</h3>
                <p className="text-gray-500 text-sm text-center mb-8 leading-relaxed">
                   {t('confirmScan')} {/* Do you want to request the opening and scanning of this envelope? */}
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setShowModal(null)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button onClick={confirmAndExecuteAction} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-sm">
                    Yes, Scan
                  </button>
                </div>
              </>
            )}

            {showModal === 'MOVE_TO_CARGO' && (
              <>
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-5 mx-auto border border-indigo-100">
                  <PackagePlus className="text-indigo-500" size={32} strokeWidth={2} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Move to Cargo</h3>
                <p className="text-gray-500 text-sm text-center mb-8 leading-relaxed">
                   {t('confirmCargo')} {/* Do you want to move this physical envelope to your PACKAGES? */}
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setShowModal(null)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button onClick={confirmAndExecuteAction} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-sm">
                    Yes, Move
                  </button>
                </div>
              </>
            )}
            
          </div>
        </div>
      )}
    </>
  );
}