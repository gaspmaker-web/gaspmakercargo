'use client';
import { useEffect, useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, User, Phone, Camera } from 'lucide-react';

type StopDetail = {
  id?: string;
  address: string;
  contact?: string;
  phone?: string;
  description?: string;
};

type Pickup = {
  id: string;
  dropOffAddress: string | null;
  description: string | null;
  createdAt: string;
  totalPaid: number | null;
  status: string;
  extraStops?: StopDetail[] | null;
  photoPickupUrl?: string | null;
  pickupPin?: string | null;
};

const statusStyle: Record<string, string> = {
  ENTREGADO:  'bg-green-100 text-green-700',
  PAGADO:     'bg-blue-100 text-blue-700',
  EN_REPARTO: 'bg-purple-100 text-purple-700',
  ACEPTADO:   'bg-orange-100 text-orange-700',
  PENDIENTE:  'bg-yellow-100 text-yellow-700',
};

const statusLabel: Record<string, string> = {
  ENTREGADO:  'Delivered',
  PAGADO:     'Paid',
  EN_REPARTO: 'En Route',
  ACEPTADO:   'Accepted',
  PENDIENTE:  'Pending',
};

function PickupCard({ pickup }: { pickup: Pickup }) {
  const [expanded, setExpanded] = useState(false);
  const stops = Array.isArray(pickup.extraStops) ? pickup.extraStops.filter(s => s.address) : [];
  const hasDetails = stops.length > 0 || pickup.photoPickupUrl;

  return (
    <div className="border-b border-gray-50 last:border-0">
      <div
        className="px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => hasDetails && setExpanded(!expanded)}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-800 truncate">
            {pickup.dropOffAddress || pickup.description || 'Delivery'}
          </p>
          <p className="text-xs text-gray-400">
            {new Date(pickup.createdAt).toLocaleDateString()} · {stops.length > 0 ? `${stops.length} stop${stops.length > 1 ? 's' : ''}` : 'Direct'}
          </p>
        </div>
        <div className="text-right flex items-center gap-2 ml-3">
          <div>
            <p className="text-sm font-bold text-gray-900">
              ${pickup.totalPaid?.toFixed(2) ?? '0.00'}
            </p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              statusStyle[pickup.status] ?? 'bg-yellow-100 text-yellow-700'
            }`}>
              {statusLabel[pickup.status] ?? pickup.status}
            </span>
          </div>
          {hasDetails && (
            <div className="text-gray-300">
              {expanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            </div>
          )}
        </div>
      </div>

      {expanded && hasDetails && (
        <div className="px-5 pb-4 bg-gray-50/50 animate-in fade-in slide-in-from-top-1 duration-200">
          {stops.length > 0 && (
            <div className="space-y-2 mb-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Delivery Stops</p>
              {stops.map((stop, i) => (
                <div key={stop.id || i} className="bg-white rounded-xl border border-gray-100 p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#222b3c] flex items-center justify-center text-[9px] font-bold text-white shrink-0 mt-0.5">{i + 1}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-800">{stop.address}</p>
                      {stop.description && <p className="text-[10px] text-gray-400 italic mt-0.5">"{stop.description}"</p>}
                      {(stop.contact || stop.phone) && (
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1.5">
                            <User size={11} className="text-blue-400"/>
                            <span className="text-xs text-blue-700 font-medium">
                              {stop.contact}{stop.phone ? ` · ${stop.phone}` : ''}
                            </span>
                          </div>
                          {stop.phone && (
                            <a href={`tel:${stop.phone}`} className="text-[10px] text-blue-500 font-bold flex items-center gap-1">
                              <Phone size={10}/> Call
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pickup.photoPickupUrl && (
            <a
              href={pickup.photoPickupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-blue-600 font-bold bg-blue-50 border border-blue-100 px-3 py-2 rounded-xl hover:bg-blue-100 transition"
            >
              <Camera size={13}/> View Pickup Photo
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function DeliveriesClient({ initialPickups }: { initialPickups: Pickup[] }) {
  const [pickups, setPickups] = useState<Pickup[]>(initialPickups);
  const [lastRefresh, setLastRefresh] = useState<string>('');

  useEffect(() => {
    setLastRefresh(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/b2b/deliveries');
      if (res.ok) {
        const data = await res.json();
        setPickups(data);
        setLastRefresh(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
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
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Delivery History</p>
        <span className="text-[10px] text-gray-300">
          {lastRefresh ? `Updated ${lastRefresh}` : ''}
        </span>
      </div>
      {pickups.length === 0 ? (
        <div className="px-5 py-8 text-center text-gray-400 text-sm">No deliveries yet.</div>
      ) : (
        <div>
          {pickups.map(pickup => (
            <PickupCard key={pickup.id} pickup={pickup} />
          ))}
        </div>
      )}
    </div>
  );
}