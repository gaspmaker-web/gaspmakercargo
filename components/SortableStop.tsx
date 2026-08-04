"use client";

/**
 * SortableStop.tsx — Enterprise Component
 *
 * Regla crítica: touch-none SOLO en el drag handle, NUNCA en el input.
 * El Autocomplete de Google necesita eventos touch libres para funcionar en móvil.
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, MapPin } from "lucide-react";
import { Autocomplete } from "@react-google-maps/api";
import { useRef } from "react";
import { useTranslations } from 'next-intl';

export interface Stop {
  id: string;
  address: string;
  description: string;
}

interface Props {
  stop: Stop;
  index: number;
  totalStops: number;
  onAddressChange: (id: string, address: string) => void;
  onDescriptionChange: (id: string, description: string) => void;
  onRemove: (id: string) => void;
  onRouteRecalc: () => void;
  color?: "blue" | "green";
}

const STYLES = {
  blue: {
    border: "border-blue-100",
    headerBg: "bg-blue-50",
    label: "text-blue-700",
    inputFocus: "focus:ring-blue-300 focus:border-blue-400",
    pin: "text-blue-400",
  },
  green: {
    border: "border-green-100",
    headerBg: "bg-green-50",
    label: "text-green-700",
    inputFocus: "focus:ring-green-300 focus:border-green-400",
    pin: "text-green-400",
  },
} as const;

export default function SortableStop({
  stop,
  index,
  totalStops,
  onAddressChange,
  onDescriptionChange,
  onRemove,
  onRouteRecalc,
  color = "blue",
}: Props) {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const s = STYLES[color];
  const t = useTranslations('Pickup');
  const letter = String.fromCharCode(66 + index); // B, C, D...

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
    zIndex: isDragging ? 999 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "rounded-xl border overflow-hidden bg-white",
        s.border,
        isDragging
          ? "shadow-xl ring-2 ring-blue-300 ring-offset-2 opacity-95"
          : "shadow-sm",
      ].join(" ")}
    >
      {/* ── Header ── */}
      <div className={["flex items-center gap-2 px-3 py-2.5", s.headerBg].join(" ")}>
        {/*
         * ✅ CRÍTICO: touch-none y style.touchAction SOLO aquí en el handle.
         * Esto permite que @dnd-kit capture el touch en el handle
         * sin interferir con los inputs de abajo.
         */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Arrastrar para reordenar"
          className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded text-gray-400 hover:text-gray-600 transition-colors"
          style={{ touchAction: "none" }}
        >
          <GripVertical size={17} />
        </button>

        <span className={["text-xs font-bold uppercase tracking-wide flex-1", s.label].join(" ")}>
          Stop {letter}
        </span>

        {totalStops > 1 && (
          <span className="text-[10px] text-gray-400 tabular-nums">
            {index + 1}/{totalStops}
          </span>
        )}

        <button
          type="button"
          onClick={() => onRemove(stop.id)}
          aria-label="Eliminar parada"
          className="p-1 rounded-lg text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      {/* ── Address input ── */}
      <div className="px-3 pt-3 pb-2">
        <Autocomplete
          onLoad={(ref) => { autocompleteRef.current = ref; }}
          onPlaceChanged={() => {
            const place = autocompleteRef.current?.getPlace();
            if (place?.formatted_address) {
              onAddressChange(stop.id, place.formatted_address);
              onRouteRecalc();
            }
          }}
          restrictions={{ country: "us" }}
        >
          <div className="relative">
            <MapPin
              size={14}
              className={["absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none", s.pin].join(" ")}
            />
            <input
              type="text"
              placeholder={`Stop ${letter}: ${t('pickupAddressPlaceholder')}`}
              defaultValue={stop.address}
              autoComplete="off"
              // ✅ SIN touchAction aquí — el input debe recibir todos los eventos touch
              className={[
                "w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm",
                "outline-none focus:ring-2 focus:border-transparent placeholder-gray-400 bg-white",
                s.inputFocus,
              ].join(" ")}
            />
          </div>
        </Autocomplete>
      </div>

      {/* ── Comment ── */}
      <div className="px-3 pb-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
            📝
          </span>
          <input
            type="text"
            placeholder={t('whatToPickupHere')}
            value={stop.description}
            onChange={(e) => onDescriptionChange(stop.id, e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gray-200 bg-gray-50 placeholder-gray-400"
          />
        </div>
      </div>
    </div>
  );
}