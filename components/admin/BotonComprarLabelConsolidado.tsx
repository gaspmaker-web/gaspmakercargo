'use client';

import { useState } from 'react';
import { Tag, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  consolidationId: string;
}

export default function BotonComprarLabelConsolidado({ consolidationId }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleBuy = async () => {
    if (!confirm("¿Comprar label de consolidación en EasyPost? (Costo Real)")) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/consolidations/buy-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consolidationId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(`✅ Label Generado: ${data.tracking}`);
      window.open(data.label, '_blank');
      router.refresh();

    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleBuy}
      disabled={loading}
      className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="animate-spin h-3 w-3" /> : <Tag className="h-3 w-3" />}
      {loading ? "..." : "Comprar Label (API)"}
    </button>
  );
}