'use client';
import { useEffect, useState, useCallback } from 'react';

type Pickup = {
  id: string;
  dropOffAddress: string | null;
  createdAt: string;
  totalPaid: number | null;
  status: string;
};

const statusStyle: Record<string, string> = {
  ENTREGADO:  'bg-green-100 text-green-700',
  PAGADO:     'bg-blue-100 text-blue-700',
  EN_REPARTO: 'bg-purple-100 text-purple-700',
  ACEPTADO:   'bg-orange-100 text-orange-700',
};

const statusLabel: Record<string, string> = {
  ENTREGADO:  'Delivered',
  PAGADO:     'Paid',
  EN_REPARTO: 'En Route',
  ACEPTADO:   'Accepted',
};

export default function DeliveriesClient({ initialPickups }: { initialPickups: Pickup[] }) {
  const [pickups, setPickups] = useState<Pickup[]>(initialPickups);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/b2b/deliveries');
      if (res.ok) {
        const data = await res.json();
        setPickups(data);
        setLastRefresh(new Date());
      }
    } catch {}
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Deliveries</p>
        <span className="text-[10px] text-gray-300">
          Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      {pickups.length === 0 ? (
        <div className="px-5 py-8 text-center text-gray-400 text-sm">No deliveries yet.</div>
      ) : (
        <div className="divide-y divide-gray-50">
          {pickups.map(pickup => (
            <div key={pickup.id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
                  {pickup.dropOffAddress}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(pickup.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">
                  ${pickup.totalPaid?.toFixed(2) ?? '0.00'}
                </p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  statusStyle[pickup.status] ?? 'bg-yellow-100 text-yellow-700'
                }`}>
                  {statusLabel[pickup.status] ?? pickup.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}