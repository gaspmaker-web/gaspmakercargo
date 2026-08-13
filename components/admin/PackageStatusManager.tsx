"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plane, Truck, Loader2, PackageCheck, AlertTriangle } from 'lucide-react';

export default function PackageStatusManager({ pkg, isConsolidation = false }: { pkg: any, isConsolidation?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);

  const changeStatus = async (newStatus: string) => {
    setConfirming(null);
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
        console.error("Error al actualizar estado");
      }
    } catch (e) {
      console.error("Error de conexión", e);
    } finally {
      setLoading(false);
    }
  };

  // ─── Confirmación inline ───────────────────────────────────────────
  if (confirming) {
    const isReparto = confirming === 'EN_REPARTO';
    return (
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm mb-6 ${isReparto ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'}`}>
        <div className="flex items-center gap-3">
          <AlertTriangle size={20} className={isReparto ? 'text-purple-600' : 'text-blue-600'} />
          <p className="text-sm font-bold">
            {isReparto
             ? "Confirm that the package ARRIVED at destination and is out for delivery?"
             : "Confirm that the package is leaving Miami in transit?"}
          </p>
        </div>
        <div className="flex gap-2">
         <button
  onClick={() => changeStatus(confirming)}
  className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-700 transition"
>
  ✅ Confirm
</button>
<button
  onClick={() => setConfirming(null)}
  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-300 transition"
>
  Cancel
</button>
</div>
</div>
);
}

  // 1. GATILLO MIAMI
  if (['PROCESADO', 'PAGADO', 'RECIBIDO_MIAMI', 'EN_ALMACEN'].includes(pkg.status)) {
    return (
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-full text-blue-600"><Plane size={24}/></div>
          <div>
            <h4 className="font-bold text-blue-900">International Dispatch</h4>
            <p className="text-xs text-blue-600">The package is ready to leave Miami.</p>
            </div>
        </div>
        <button 
          onClick={() => setConfirming('EN_TRANSITO')} 
          disabled={loading} 
          className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin"/> : <Plane size={18}/>}
          SHIP (IN TRANSIT)
        </button>
      </div>
    );
  }

  // 2. GATILLO DESTINO
  if (['EN_TRANSITO', 'ENVIADO'].includes(pkg.status)) {
    return (
      <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in ring-2 ring-purple-100 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 p-2 rounded-full text-purple-600"><PackageCheck size={24}/></div>
          <div>
         <h4 className="font-bold text-purple-900">Destination Reception</h4>
          <p className="text-xs text-purple-600">Confirm that you have the package in hand.</p>
          </div>
        </div>
        <button 
          onClick={() => setConfirming('EN_REPARTO')} 
          disabled={loading} 
          className="w-full sm:w-auto bg-purple-600 text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-purple-700 transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin"/> : <Truck size={18}/>}
          RECEIVE (OUT FOR DELIVERY)
        </button>
      </div>
    );
  }

  // 3. EN REPARTO (Informativo)
  if (['EN_REPARTO', 'OUT_FOR_DELIVERY', 'EN_RUTA'].includes(pkg.status)) {
    return (
      <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 flex items-center justify-between shadow-sm mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-orange-100 p-2 rounded-full text-orange-600"><Truck size={20}/></div>
          <div>
            <h4 className="font-bold text-orange-800">Out for Delivery with Driver</h4>
            <p className="text-xs text-orange-600">Waiting for the driver to confirm delivery in the App.</p>
          </div>
        </div>
        <span className="text-xs font-bold bg-white text-orange-600 px-3 py-1 rounded border border-orange-200 animate-pulse">
          In Progress...
        </span>
      </div>
    );
  }

  return null;
}