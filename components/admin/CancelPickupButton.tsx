'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CancelPickupButton({ pickupId, status, totalPaid }: { 
  pickupId: string; 
  status: string;
  totalPaid: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [refund, setRefund] = useState(false);

  const cancelableStatuses = ['PENDIENTE', 'PAGADO', 'ACEPTADO', 'EN_CAMINO'];
  if (!cancelableStatuses.includes(status)) return null;

  const handleCancel = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/cancel-pickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickupId, refund }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      alert(`✅ Pickup cancelado${data.refundId ? ' y reembolso procesado' : ''}.`);
      router.refresh();
    } catch (e: any) {
      alert('❌ Error: ' + e.message);
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
      <p className="font-bold text-red-700 text-sm">⚠️ ¿Cancelar este pickup?</p>
      {totalPaid > 0 && (
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={refund} onChange={e => setRefund(e.target.checked)} className="w-4 h-4" />
          Reembolsar ${totalPaid.toFixed(2)} al cliente
        </label>
      )}
      <div className="flex gap-2">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Cancelando...' : 'Sí, cancelar'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-bold text-sm hover:bg-gray-200"
        >
          No, volver
        </button>
      </div>
    </div>
  );

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="w-full bg-red-50 border border-red-200 text-red-700 py-2 rounded-xl font-bold text-sm hover:bg-red-100 transition"
    >
      ❌ Cancelar Pickup
    </button>
  );
}
