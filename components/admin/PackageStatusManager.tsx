"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plane, Truck, Loader2, PackageCheck } from 'lucide-react';

export default function PackageStatusManager({ pkg, isConsolidation = false }: { pkg: any, isConsolidation?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const changeStatus = async (newStatus: string) => {
    const confirm = window.confirm(
        newStatus === 'EN_REPARTO' 
        ? "¿Confirmas que el paquete LLEGÓ FÍSICAMENTE a destino y sale a reparto?" 
        : "¿Cambiar estado?"
    );
    if (!confirm) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/packages/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            packageId: pkg.id, 
            newStatus,
            isConsolidation 
        })
      });
      
      if (res.ok) {
        router.refresh(); 
      } else {
        alert("Error al actualizar estado");
      }
    } catch (e) {
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // 1. GATILLO MIAMI
  if (pkg.status === 'PROCESADO' || pkg.status === 'PAGADO' || pkg.status === 'RECIBIDO_MIAMI' || pkg.status === 'EN_ALMACEN') {
    return (
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in mb-6">
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full text-blue-600"><Plane size={24}/></div>
                <div>
                    <h4 className="font-bold text-blue-900">Despacho Internacional</h4>
                    <p className="text-xs text-blue-600">El paquete está listo para salir de Miami.</p>
                </div>
            </div>
            <button 
                onClick={() => changeStatus('EN_TRANSITO')} 
                disabled={loading} 
                className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-md"
            >
                {loading ? <Loader2 className="animate-spin"/> : <Plane size={18}/>}
                ENVIAR (EN TRÁNSITO)
            </button>
        </div>
    );
  }

  // 2. GATILLO DESTINO: Recibir y sacar a Reparto
  if (pkg.status === 'EN_TRANSITO' || pkg.status === 'ENVIADO') {
    return (
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in ring-2 ring-purple-100 mb-6">
            <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-full text-purple-600"><PackageCheck size={24}/></div>
                <div>
                    <h4 className="font-bold text-purple-900">Recepción en Destino</h4>
                    <p className="text-xs text-purple-600">Confirma que tienes el paquete en mano.</p>
                </div>
            </div>
            <button 
                // 🔥 SOLUCIÓN: Volvemos al estado oficial 'EN_REPARTO'. 
                // El Admin ya no se confundirá, y el Chofer lo seguirá viendo.
                onClick={() => changeStatus('EN_REPARTO')} 
                disabled={loading} 
                className="w-full sm:w-auto bg-purple-600 text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-purple-700 transition flex items-center justify-center gap-2 shadow-md"
            >
                {loading ? <Loader2 className="animate-spin"/> : <Truck size={18}/>}
                RECIBIR (SACAR A REPARTO)
            </button>
        </div>
    );
  }

  // 3. EN REPARTO: (Informativo)
  if (pkg.status === 'EN_REPARTO' || pkg.status === 'OUT_FOR_DELIVERY' || pkg.status === 'EN_RUTA') {
    return (
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 flex items-center justify-between shadow-sm mb-6">
             <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-full text-orange-600"><Truck size={20}/></div>
                <div>
                    <h4 className="font-bold text-orange-800">En Ruta con Chofer</h4>
                    <p className="text-xs text-orange-600">Esperando que el driver confirme la entrega en App.</p>
                </div>
            </div>
            <span className="text-xs font-bold bg-white text-orange-600 px-3 py-1 rounded border border-orange-200 animate-pulse">
                En Progreso...
            </span>
        </div>
    );
  }

  return null;
}