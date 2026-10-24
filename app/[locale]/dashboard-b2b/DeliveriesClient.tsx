'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp, User, Phone, Camera, PackageCheck } from 'lucide-react';

type StopDetail = {
  id?: string;
  address: string;
  contact?: string;
  phone?: string;
  description?: string;
  photoUrl?: string;         // ← este es el campo real
  photoDeliveryUrl?: string; // ← mantener por compatibilidad
  photoUrls?: string[];
  recipientName?: string;
  type?: string;
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
  photoDeliveryUrl?: string | null;
  recipientName?: string | null;
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
  const stops = Array.isArray(pickup.extraStops) ? pickup.extraStops.filter(s => s.address && s.type !== 'PICKUP') : [];
  const hasDetails = stops.length > 0 || pickup.photoPickupUrl || pickup.photoDeliveryUrl || pickup.recipientName;

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
            <p className="text-sm font-bold text-gray-900">${pickup.totalPaid?.toFixed(2) ?? '0.00'}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusStyle[pickup.status] ?? 'bg-yellow-100 text-yellow-700'}`}>
              {statusLabel[pickup.status] ?? pickup.status}
            </span>
          </div>
          {hasDetails && (
            <div className="text-gray-300">{expanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}</div>
          )}
        </div>
      </div>

      {expanded && hasDetails && (
        <div className="px-5 pb-4 bg-gray-50/50 animate-in fade-in slide-in-from-top-1 duration-200 space-y-3">

          {/* Direct delivery (no stops) */}
          {stops.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Delivery Confirmation</p>
              {pickup.recipientName && (
                <div className="flex items-center gap-1.5">
                  <PackageCheck size={13} className="text-green-500"/>
                  <span className="text-xs font-semibold text-gray-800">Received by: {pickup.recipientName}</span>
                </div>
              )}
              {pickup.photoPickupUrl && (
                <a href={pickup.photoPickupUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-blue-600 font-bold bg-blue-50 border border-blue-100 px-3 py-2 rounded-xl hover:bg-blue-100 transition">
                  <Camera size={13}/> View Pickup Photo
                </a>
              )}
              {pickup.photoDeliveryUrl && (
                <a href={pickup.photoDeliveryUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-green-700 font-bold bg-green-50 border border-green-100 px-3 py-2 rounded-xl hover:bg-green-100 transition">
                  <Camera size={13}/> View Delivery Photo
                </a>
              )}
            </div>
          )}
                    {/* Pickup origin section */}
          {stops.length > 0 && (() => {
            const pickupStop = Array.isArray(pickup.extraStops) ? pickup.extraStops.find((s: any) => s.type === 'PICKUP') : null;
            const pickupPhotos = pickupStop?.photoUrls?.length ? pickupStop.photoUrls : (pickup.photoPickupUrl ? [pickup.photoPickupUrl] : []);
            if (pickupPhotos.length === 0) return null;
            return (
              <div className="bg-white rounded-xl border border-blue-100 p-3 space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pickup Origin</p>
                <div className="flex flex-wrap gap-1.5">
                  {pickupPhotos.map((url: string, pi: number) => (
                    <a key={pi} href={url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[10px] text-blue-600 font-bold bg-blue-50 border border-blue-100 px-2 py-1 rounded-lg hover:bg-blue-100 transition">
                      <Camera size={11}/> Photo {pickupPhotos.length > 1 ? pi + 1 : ''}
                    </a>
                  ))}
                </div>
              </div>
            );
          })()}
          
          {/* Multi-stop deliveries */}
          {stops.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Delivery Stops</p>
              {stops.map((stop, i) => (
                <div key={stop.id || i} className="bg-white rounded-xl border border-gray-100 p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#222b3c] flex items-center justify-center text-[9px] font-bold text-white shrink-0 mt-0.5">{i + 1}</div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="text-xs font-semibold text-gray-800">{stop.address}</p>
                      {stop.description && <p className="text-[10px] text-gray-400 italic">"{stop.description}"</p>}
                      {(stop.contact || stop.phone) && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <User size={11} className="text-blue-400"/>
                            <span className="text-xs text-blue-700 font-medium">{stop.contact}{stop.phone ? ` · ${stop.phone}` : ''}</span>
                          </div>
                          {stop.phone && (
                            <a href={`tel:${stop.phone}`} className="text-[10px] text-blue-500 font-bold flex items-center gap-1">
                              <Phone size={10}/> Call
                            </a>
                          )}
                        </div>
                      )}
                      {(stop.recipientName || (i === stops.length - 1 && pickup.recipientName)) && (
                        <div className="flex items-center gap-1.5">
                          <PackageCheck size={11} className="text-green-500"/>
                          <span className="text-[10px] text-green-700 font-semibold">Received by: {stop.recipientName || pickup.recipientName}</span>
                        </div>
                      )}
                      {(() => {
                        const isLast = i === stops.length - 1;
                        const allPhotos = stop.photoUrls?.length
                          ? stop.photoUrls
                          : (stop.photoUrl ? [stop.photoUrl] : (stop.photoDeliveryUrl ? [stop.photoDeliveryUrl] : (isLast && pickup.photoDeliveryUrl ? [pickup.photoDeliveryUrl] : [])));
                        return allPhotos.map((url, pi) => (
                          <a key={pi} href={url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[10px] text-green-700 font-bold bg-green-50 border border-green-100 px-2 py-1 rounded-lg hover:bg-green-100 transition">
                            <Camera size={11}/> Photo {allPhotos.length > 1 ? pi + 1 : ''}
                          </a>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DeliveriesClient({ initialPickups }: { initialPickups: Pickup[] }) {
  if (initialPickups.length === 0) return <div className="p-8 text-center text-gray-400 text-sm">No deliveries yet.</div>;

  return (
    <div className="divide-y divide-gray-50">
      {initialPickups.map(p => <PickupCard key={p.id} pickup={p} />)}
    </div>
  );
}
