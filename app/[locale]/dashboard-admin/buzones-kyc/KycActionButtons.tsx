"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  subscriptionId: string;
  userId: string;
  isPrimary: boolean;
  recipientId?: string;
  currentSuite?: string | null; 
}

export default function KycActionButtons({ subscriptionId, userId, isPrimary, recipientId, currentSuite }: Props) {
  const router = useRouter();
  
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [suiteNo, setSuiteNo] = useState('');

  // 🔥 MAGIA DE AUTO-LLENADO REFORZADA 🔥
  // Esto obliga a React a leer el número (ej: US-76826) y extraer solo los dígitos apenas se carga el botón
  useEffect(() => {
    if (currentSuite) {
        setSuiteNo(currentSuite.replace(/\D/g, '')); 
    }
  }, [currentSuite]);

  const handleApprove = async () => {
    if (!suiteNo.trim()) {
        alert("El número de PMB no puede estar vacío.");
        return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/kyc/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            subscriptionId, 
            userId, 
            suiteNo: suiteNo, 
            isPrimary, 
            recipientId 
        })
      });

      if (res.ok) {
        setIsApproving(false);
        router.refresh();
      } else {
        alert("Error al aprobar.");
      }
    } catch (error) {
      alert("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
        alert("Debes escribir una razón de rechazo.");
        return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/kyc/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            subscriptionId, 
            reason, 
            isPrimary, 
            recipientId 
        })
      });

      if (res.ok) {
        setIsRejecting(false);
        router.refresh();
      } else {
        alert("Error al rechazar.");
      }
    } catch (error) {
      alert("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-end gap-2">
        <button onClick={() => setIsApproving(true)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-colors border border-green-100 shadow-sm" title="Aprobar">
            <CheckCircle size={20} />
        </button>
        <button onClick={() => setIsRejecting(true)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors border border-red-100 shadow-sm" title="Rechazar">
            <XCircle size={20} />
        </button>
      </div>

      {/* MODAL DE APROBACIÓN */}
      {isApproving && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm text-left animate-in fade-in">
              <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Aprobar {isPrimary ? "Titular" : "Adicional"}
                  </h3>
                  
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                        {isPrimary 
                            ? "Verifica el PMB a registrar en USPS. El sistema ha extraído los números automáticamente." 
                            : "Verifica el PMB compartido bajo el cual operará esta persona adicional."}
                    </p>
                    
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500">
                            <Sparkles size={16} />
                        </span>
                        <input 
                            type="text" 
                            value={suiteNo} 
                            onChange={(e) => setSuiteNo(e.target.value)} 
                            className="w-full pl-9 pr-3 py-3 border border-green-200 rounded-xl font-mono font-bold text-gray-900 outline-none focus:border-green-500 bg-green-50/30 text-lg shadow-inner transition-colors" 
                        />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 font-medium uppercase tracking-wider text-center">Formato oficial USPS: Solo números</p>
                  </div>

                  <div className="flex gap-3">
                      <button onClick={() => setIsApproving(false)} className="flex-1 p-3 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition">Cancelar</button>
                      <button onClick={handleApprove} disabled={loading} className="flex-1 p-3 font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
                          {loading ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle size={18}/>} Confirmar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL DE RECHAZO */}
      {isRejecting && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm text-left animate-in fade-in">
              <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100">
                  <h3 className="text-xl font-bold text-red-600 mb-2">Rechazar Documentos</h3>
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">Escribe la razón para que el cliente la corrija de inmediato.</p>
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej: La foto del pasaporte está cortada..." className="w-full p-3 border border-red-200 bg-red-50/50 rounded-xl mb-6 text-sm text-gray-800 outline-none focus:border-red-500 h-28 resize-none shadow-inner" />
                  <div className="flex gap-3">
                      <button onClick={() => setIsRejecting(false)} className="flex-1 p-3 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition">Cancelar</button>
                      <button onClick={handleReject} disabled={loading} className="flex-1 p-3 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
                          {loading ? <Loader2 className="animate-spin" size={18}/> : <XCircle size={18}/>} Rechazar
                      </button>
                  </div>
              </div>
          </div>
      )}
    </>
  );
}