'use client';

import { useState } from 'react';
import { DollarSign, Loader2 } from 'lucide-react';

export default function CashPaymentButton({ shipmentId, shipmentNumber }: { shipmentId: string; shipmentNumber: string }) {
    const [loading, setLoading] = useState(false);

    async function handleCashPayment() {
        if (!confirm(`Mark ${shipmentNumber} as paid with cash?`)) return;
        setLoading(true);
        try {
            const res = await fetch('/api/admin/consolidations/cash-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shipmentId }),
            });
            if (res.ok) {
                alert('✅ Payment registered successfully.');
                window.location.reload();
            } else {
                const data = await res.json();
                alert(data.error || 'Error registering payment.');
            }
        } catch {
            alert('Connection error.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={handleCashPayment}
            disabled={loading}
            className="mt-2 w-full px-4 py-2 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
        >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <DollarSign size={14} />}
            Mark as Paid (Cash)
        </button>
    );
}