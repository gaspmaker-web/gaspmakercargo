'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  consolidationId: string;
  userName: string;
}

export default function BotonConfirmarZelle({ consolidationId, userName }: Props) {
  const [loading, setLoading] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);
  const router = useRouter();

  const handleUndo = async () => {
    setUndoing(true);
    try {
      const res = await fetch('/api/admin/consolidations/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentId: consolidationId }),
      });
      const data = await res.json();
      if (res.ok) {
        router.refresh();
      } else {
        alert(data.error || 'Error al cancelar');
      }
    } catch (e) {
      alert('Error de conexión');
    } finally {
      setUndoing(false);
      setShowUndoConfirm(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirm(`Confirm Zelle payment for ${userName}?`)) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/confirm-zelle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consolidationId })
      });
      if (res.ok) {
        alert('✅ Zelle payment confirmed');
        router.refresh();
      } else {
        const data = await res.json();
        alert(`❌ Error: ${data.error}`);
      }
    } catch (e) {
      alert('❌ Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
      onClick={handleConfirm}
      disabled={loading}
      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50"
    >
      {loading ? '...' : '💜 Confirm Zelle Payment'}
    </button>
      {showUndoConfirm ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2">
          <button onClick={handleUndo} disabled={undoing} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-red-700 disabled:opacity-50">
            {undoing ? 'Cancelando...' : 'Sí, cancelar envío'}
          </button>
          <button onClick={() => setShowUndoConfirm(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-bold text-sm">
            No, volver
          </button>
        </div>
      ) : (
        <button onClick={() => setShowUndoConfirm(true)} className="w-full border border-red-200 text-red-600 py-2 rounded-xl font-bold text-sm hover:bg-red-50 transition">
          ↩️ Cancelar Envío
        </button>
      )}
    </div>
  );
}
