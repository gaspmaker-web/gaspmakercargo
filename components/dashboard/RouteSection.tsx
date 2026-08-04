"use client";

/**
 * RouteSection.tsx — Enterprise v2
 *
 * Arquitectura: UN SOLO ARRAY de paradas — igual que Uber/Lyft
 * - Todo es draggable: Pickup, intermedios, Dropoff
 * - Cada parada tiene dirección + descripción
 * - El primero siempre es PICKUP, el último siempre es DROPOFF
 * - Reordenar → recalcula ruta automáticamente
 */

import React, { useRef, useCallback } from "react";
import { Autocomplete } from "@react-google-maps/api";
import {
  DndContext, closestCenter, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertTriangle, MapPin, Plus, Warehouse, GripVertical, X } from "lucide-react";

const ALLOWED_COUNTIES = ["Miami-Dade County", "Broward County"];

export type StopType = "PICKUP" | "STOP" | "DROPOFF";

export interface Stop {
  id: string;
  type: StopType;
  address: string;
  description: string;
  error?: string;
}

interface RouteSectionProps {
  serviceType: "SHIPPING" | "DELIVERY";
  stops: Stop[];
  distanceMiles: number;
  onStopAddressValid: (id: string, address: string) => void;
  onStopAddressError: (id: string, error: string) => void;
  onStopAddressClear: (id: string) => void;
  onStopDescriptionChange: (id: string, description: string) => void;
  onAddStop: () => void;
  onRemoveStop: (id: string) => void;
  onDragEnd: (event: DragEndEvent) => void;
  sensors: any;
  // i18n
  t_routeTitle: string;
  t_pickupPointA: string;
  t_dropoffLabel: string;
  t_interDestTitle: string;
  t_gmcWarehouse: string;
  t_exportNote: string;
  t_pickupDescPlaceholder: string;
  t_dropoffDescPlaceholder: string;
  t_addStop: string;
  t_countyError: string;
  t_pickupAddress: string;
  t_dropoffAddress: string;
}

// ─── Stop dot color por tipo ──────────────────────────────────────────────────
function StopDot({ type, letter, serviceType }: {
  type: StopType;
  letter: string;
  serviceType: "SHIPPING" | "DELIVERY";
}) {
  if (type === "PICKUP") {
    return (
      <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center shrink-0 shadow-sm">
        <span className="text-white text-[10px] font-black">A</span>
      </div>
    );
  }
  if (type === "DROPOFF") {
    return (
      <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center shrink-0 shadow-sm">
        <MapPin size={13} className="text-white" />
      </div>
    );
  }
  // STOP intermedio
  const color = serviceType === "SHIPPING" ? "bg-blue-600" : "bg-green-600";
  return (
    <div className={`w-7 h-7 rounded-full ${color} flex items-center justify-center shrink-0 shadow-sm`}>
      <span className="text-white text-[10px] font-black">{letter}</span>
    </div>
  );
}

// ─── SortableStopRow — cada fila draggable ────────────────────────────────────
function SortableStopRow({
  stop,
  letter,
  serviceType,
  isOnly,
  onAddressValid,
  onAddressError,
  onAddressClear,
  onDescriptionChange,
  onRemove,
  t_pickupDescPlaceholder,
  t_dropoffDescPlaceholder,
  t_countyError,
  t_pickupAddress,
  t_dropoffAddress,
}: {
  stop: Stop;
  letter: string;
  serviceType: "SHIPPING" | "DELIVERY";
  isOnly: boolean;
  onAddressValid: (id: string, address: string) => void;
  onAddressError: (id: string, error: string) => void;
  onAddressClear: (id: string) => void;
  onDescriptionChange: (id: string, description: string) => void;
  onRemove: (id: string) => void;
  t_pickupDescPlaceholder: string;
  t_dropoffDescPlaceholder: string;
  t_countyError: string;
  t_pickupAddress: string;
  t_dropoffAddress: string;
}) {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  // ✅ Ref al input DOM — necesario para limpiar visualmente (defaultValue no controlado)
  const inputRef = useRef<HTMLInputElement | null>(null);

  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: stop.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
    zIndex: isDragging ? 999 : undefined,
  };

  // Limpia visualmente el input Y notifica al padre
  const handleClearInput = () => {
    if (inputRef.current) inputRef.current.value = '';
    onAddressClear(stop.id);
  };

  const handlePlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.geometry || !place?.formatted_address) {
      onAddressClear(stop.id);
      return;
    }
    const countyComp = place.address_components?.find(c =>
      c.types.includes("administrative_area_level_2")
    );
    const county = countyComp?.long_name ?? "";
    if (!ALLOWED_COUNTIES.some(a => a === county)) {
      onAddressError(stop.id, `${t_countyError} (${county || "—"})`);
      return;
    }
    onAddressValid(stop.id, place.formatted_address);
  }, [stop.id, onAddressValid, onAddressError, onAddressClear]);

  const isPickup = stop.type === "PICKUP";
  const isDropoff = stop.type === "DROPOFF";
  const isStop = stop.type === "STOP";

  // Colores por tipo
  const borderColor = isPickup ? "border-gray-200"
    : isDropoff ? "border-green-200"
    : serviceType === "SHIPPING" ? "border-blue-100" : "border-green-100";

  const headerBg = isPickup ? "bg-gray-50"
    : isDropoff ? "bg-green-50"
    : serviceType === "SHIPPING" ? "bg-blue-50" : "bg-green-50";

  const labelColor = isPickup ? "text-gray-600"
    : isDropoff ? "text-green-700"
    : serviceType === "SHIPPING" ? "text-blue-700" : "text-green-700";

  const inputFocus = isPickup ? "focus:ring-gray-300"
    : isDropoff ? "focus:ring-green-300"
    : serviceType === "SHIPPING" ? "focus:ring-blue-300" : "focus:ring-green-300";

  const pinColor = isPickup ? "text-gray-400"
    : isDropoff ? "text-green-500"
    : serviceType === "SHIPPING" ? "text-blue-400" : "text-green-400";

  const descPlaceholder = isDropoff
    ? t_dropoffDescPlaceholder
    : t_pickupDescPlaceholder;

  const label = isPickup ? "PICKUP"
    : isDropoff ? "DROPOFF"
    : `STOP ${letter}`;

  // Mostrar X si tiene dirección confirmada
  const hasAddress = stop.address !== '';

  return (
    <div ref={setNodeRef} style={style}>
      <div className={`rounded-xl border ${borderColor} overflow-hidden bg-white
        ${isDragging ? "shadow-xl ring-2 ring-blue-300 ring-offset-2 opacity-95" : "shadow-sm"}`}>

        {/* Header */}
        <div className={`flex items-center gap-2 px-3 py-2.5 ${headerBg}`}>
          {/* Drag handle — touch-none SOLO aquí */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label="drag"
            className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded text-gray-300 hover:text-gray-500 transition-colors"
            style={{ touchAction: "none" }}
          >
            <GripVertical size={17} />
          </button>

          <span className={`text-xs font-bold uppercase tracking-wide flex-1 ${labelColor}`}>
            {label}
          </span>

          {/* STOP intermedio → elimina la fila */}
          {isStop && (
            <button
              type="button"
              onClick={() => onRemove(stop.id)}
              aria-label="Eliminar parada"
              className="p-1 rounded-lg text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <X size={15} />
            </button>
          )}

          {/* PICKUP / DROPOFF → limpia la dirección (no elimina la fila) */}
          {(isPickup || isDropoff) && hasAddress && (
            <button
              type="button"
              onClick={handleClearInput}
              aria-label="Limpiar dirección"
              className="p-1 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Address */}
        <div className="px-3 pt-3 pb-2">
          <Autocomplete
            onLoad={ref => { autocompleteRef.current = ref; }}
            onPlaceChanged={handlePlaceChanged}
            restrictions={{ country: "us" }}
          >
            <div className="relative">
              <MapPin
                size={14}
                className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${pinColor}`}
              />
              <input
                ref={inputRef}
                type="text"
                placeholder={isDropoff ? t_dropoffAddress : t_pickupAddress}
                defaultValue={stop.address}
                autoComplete="off"
                style={{ fontSize: '16px' }}
                className={[
                  "w-full pl-9 pr-8 py-3 border rounded-xl font-medium transition-colors",
                  "focus:outline-none focus:ring-2 focus:border-transparent placeholder-gray-400",
                  stop.error
                    ? "border-red-400 bg-red-50 text-red-900 focus:ring-red-300"
                    : `border-gray-200 bg-white ${inputFocus}`,
                ].join(" ")}
                onChange={() => onAddressClear(stop.id)}
              />
            </div>
          </Autocomplete>
          {stop.error && (
            <div className="mt-1.5 flex items-center gap-1.5 text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg text-xs font-semibold">
              <AlertTriangle size={13} className="shrink-0" />
              <span>{stop.error}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="px-3 pb-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none">
              {isDropoff ? "📦" : "📝"}
            </span>
            <input
              type="text"
              placeholder={descPlaceholder}
              value={stop.description}
              onChange={e => onDescriptionChange(stop.id, e.target.value)}
              style={{ fontSize: '16px' }}
              className="w-full pl-9 pr-3 py-3 border border-gray-100 rounded-xl
                outline-none focus:ring-2 focus:ring-gray-200 bg-gray-50 placeholder-gray-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── RouteSection principal ───────────────────────────────────────────────────
export default function RouteSection({
  serviceType,
  stops,
  distanceMiles,
  onStopAddressValid,
  onStopAddressError,
  onStopAddressClear,
  onStopDescriptionChange,
  onAddStop,
  onRemoveStop,
  onDragEnd,
  sensors,
  t_routeTitle,
  t_pickupPointA,
  t_dropoffLabel,
  t_interDestTitle,
  t_gmcWarehouse,
  t_exportNote,
  t_pickupDescPlaceholder,
  t_dropoffDescPlaceholder,
  t_addStop,
  t_countyError,
  t_pickupAddress,
  t_dropoffAddress,
}: RouteSectionProps) {
  const getStopLetter = (index: number) => String.fromCharCode(66 + index);
  let stopLetterIndex = 0;
  const intermediateCount = stops.filter(s => s.type === "STOP").length;
  const nextLetter = String.fromCharCode(66 + intermediateCount);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <h3 className="font-bold text-gmc-gris-oscuro text-sm uppercase tracking-wide">
          {t_routeTitle}
        </h3>
      </div>

      <div className="relative px-4 py-4">
        <div className="absolute left-[30px] top-8 bottom-8 w-px bg-gray-200 pointer-events-none" />

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={stops.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {stops.map((stop) => {
                const letter = stop.type === "STOP" ? getStopLetter(stopLetterIndex++) : "";
                return (
                  <div key={stop.id} className="flex items-start gap-3">
                    <div className="shrink-0 z-10 mt-3">
                      <StopDot type={stop.type} letter={letter} serviceType={serviceType} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <SortableStopRow
                        stop={stop}
                        letter={letter}
                        serviceType={serviceType}
                        isOnly={stops.length <= 2}
                        onAddressValid={onStopAddressValid}
                        onAddressError={onStopAddressError}
                        onAddressClear={onStopAddressClear}
                        onDescriptionChange={onStopDescriptionChange}
                        onRemove={onRemoveStop}
                        t_pickupDescPlaceholder={t_pickupDescPlaceholder}
                        t_dropoffDescPlaceholder={t_dropoffDescPlaceholder}
                        t_countyError={t_countyError}
                        t_pickupAddress={t_pickupAddress}
                        t_dropoffAddress={t_dropoffAddress}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>

        {/* Botón Add Stop — SHIPPING y DELIVERY */}
        <div className="flex items-center gap-3 mt-3">
          <div className="w-7 shrink-0 flex justify-center z-10">
            <div className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 bg-white flex items-center justify-center">
              <Plus size={9} className="text-gray-400" />
            </div>
          </div>
          <button
            type="button"
            onClick={onAddStop}
            className={[
              "flex-1 py-2.5 border-2 border-dashed rounded-xl text-xs font-bold",
              "transition-colors flex items-center justify-center gap-1.5",
              "border-gray-200 text-gray-400",
              serviceType === "SHIPPING"
                ? "hover:border-blue-400 hover:text-blue-500"
                : "hover:border-green-400 hover:text-green-500",
            ].join(" ")}
          >
            <Plus size={12} /> {t_addStop} ({nextLetter})
          </button>
        </div>

        {/* Bodega GMC — solo SHIPPING */}
        {serviceType === "SHIPPING" && (
          <div className="flex items-start gap-3 mt-3">
            <div className="w-7 shrink-0 flex justify-center z-10 mt-1">
              <div className="w-7 h-7 rounded-md bg-gray-700 flex items-center justify-center shadow-sm">
                <Warehouse size={13} className="text-white" />
              </div>
            </div>
            <div className="flex-1 p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">{t_interDestTitle}</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">{t_gmcWarehouse}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{t_exportNote}</p>
            </div>
          </div>
        )}
      </div>

      {/* Distancia estimada */}
      {distanceMiles > 0 && (
        <div className="mx-4 mb-4 flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
          <MapPin size={12} className="text-gray-400 shrink-0" />
          <span className="text-xs text-gray-500 font-medium">
            {distanceMiles} mi · ruta estimada
          </span>
        </div>
      )}
    </div>
  );
}