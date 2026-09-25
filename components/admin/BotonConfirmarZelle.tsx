'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  consolidationId: string;
  userName: string;
}

export default function BotonConfirmarZelle({ consolidationId, userName }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
    <button
      onClick={handleConfirm}
      disabled={loading}
      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50"
    >
      {loading ? '...' : '💜 Confirm Zelle Payment'}
    </button>
  );
}
