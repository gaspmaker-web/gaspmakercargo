"use client";

import React, { useState } from 'react';
import { PackagePlus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CargoConfirmButton({ mailItemId }: { mailItemId: string }) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    if (!confirm("📦 ¿Confirmas que tomaste este sobre físico y lo pasaste al estante de PAQUETES/CARGA?")) return;

    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/bodega/convertir-paquete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mailItemId }),
      });

      if (res.ok) {
        router.refresh(); // Recarga la tabla
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
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
      className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wider font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
    >
      {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <PackagePlus size={14} />}
      Convertir a Paquete
    </button>
  );
}