'use client';

import { useState } from 'react';
import { Truck, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  id: string;
  type: 'PACKAGE' | 'CONSOLIDATION'; // Para saber qué estamos despachando
  courier?: string | null;
}

export default function BotonDespachar({ id, type, courier }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Estado para el Modal
  const [showModal, setShowModal] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');

  const handleDispatch = async () => {
    if (!trackingNumber) return alert("Escribe el Tracking Number");
    
    setLoading(true);
    try {
      const res = await fetch('/api/packages/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            packageId: id, // La API debe estar lista para recibir esto
            finalTrackingNumber: trackingNumber,
            type: type // Enviamos el tipo para que la API sepa qué tabla actualizar
        })
      });

      if (res.ok) {
        alert("✅ Despachado correctamente");
        setShowModal(false);
        router.refresh(); // Recarga la lista
      } else {
        alert("❌ Error al despachar");
      }
    } catch (error) {
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
      >
        <Truck size={16} /> Despachar
      </button>

      {/* MODAL SIMPLE */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold mb-1">Despachar Envío</h3>
            <p className="text-sm text-gray-500 mb-4">Courier: {courier || 'No definido'}</p>
            
            <label className="block text-xs font-bold text-gray-700 mb-1">TRACKING NUMBER</label>
            <input 
              autoFocus
              type="text" 
              className="w-full border p-2 rounded mb-4 font-mono uppercase"
              placeholder="Ej: 1Z999..."
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDispatch}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold flex items-center gap-2"
              >
                {loading && <Loader2 size={14} className="animate-spin"/>}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}