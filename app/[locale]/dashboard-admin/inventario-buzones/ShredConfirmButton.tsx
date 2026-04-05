"use client";

import React, { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ShredConfirmButton({ mailItemId }: { mailItemId: string }) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    // 🛡️ Doble confirmación para evitar que el operario toque por accidente
    if (!confirm("⚠️ ATENCIÓN: ¿Confirmas que este sobre físico ya pasó por la máquina trituradora y fue destruido?")) return;

    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/bodega/confirmar-trituracion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mailItemId }),
      });

      if (res.ok) {
        router.refresh(); // Recarga la tabla al instante
      } else {
        alert("Error al actualizar el estado en el servidor.");
      }
    } catch (error) {
      alert("Error de conexión.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button 
      onClick={handleConfirm}
      disabled={isProcessing}
      className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wider font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
    >
      {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
      Confirmar Trituración
    </button>
  );
}