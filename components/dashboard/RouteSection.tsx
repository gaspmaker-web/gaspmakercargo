"use client";

/**
 * RouteSection.tsx — Enterprise Component
 *
 * Responsabilidad única: renderizar el timeline de ruta (A → paradas → B/Bodega)
 * con Google Autocomplete estable. NUNCA se desmonta mientras el serviceType no cambia.
 *
 * Regla crítica: los refs de Autocomplete viven AQUÍ, no en el padre.
 * El padre recibe los valores via callbacks, no controla los inputs directamente.
 */

import React, { useRef, useCallback } from "react";
import { Autocomplete } from "@react-google-maps/api";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AlertTriangle, MapPin, Plus, Warehouse } from "lucide-react";
import SortableStop from "./SortableStop";

const ALLOWED_COUNTIES = ["Miami-Dade County", "Broward County"];

export interface ExtraStop {
  id: string;
  address: string;
  description: string;
}

interface RouteSectionProps {
  serviceType: "SHIPPING" | "DELIVERY";

  // Valores actuales (para mostrar errores, distancia)
  originAddress: string;
  dropOffAddress: string;
  addressError: string | null;
  dropOffError: string | null;
  distanceMiles: number;
  extraStops: ExtraStop[];

  // Callbacks al padre
  onOriginValid: (address: string) => void;
  onOriginError: (msg: string) => void;
  onOriginClear: () => void;
  onDropoffValid: (address: string) => void;
  onDropoffError: (msg: string) => void;
  onDropoffClear: () => void;

  onAddStop: () => void;
  onRemoveStop: (id: string) => void;
  onStopAddressChange: (id: string, address: string) => void;
  onStopDescriptionChange: (id: string, description: string) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onRouteRecalc: () => void;

  // dnd-kit sensors (creados en el padre con TouchSensor)
  sensors: ReturnType<typeof import("@dnd-kit/core").useSensors>;

  // i18n
  labels: {
    routeTitle: string;
    pickupPointA: string;
    dropoffPointB: string;
    interDestTitle: string;
    gmcWarehouse: string;
    exportNote: string;
  };
}

export default function RouteSection({
  serviceType,
  originAddress,
  dropOffAddress,
  addressError,
  dropOffError,
  distanceMiles,
  extraStops,
  onOriginValid,
  onOriginError,
  onOriginClear,
  onDropoffValid,
  onDropoffError,
  onDropoffClear,
  onAddStop,
  onRemoveStop,
  onStopAddressChange,
  onStopDescriptionChange,
  onDragEnd,
  onRouteRecalc,
  sensors,
  labels,
}: RouteSectionProps) {
  // ✅ Refs estables: nunca se destruyen mientras este componente esté montado
  const originAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const validateCounty = (place: google.maps.places.PlaceResult): string | null => {
    if (!place.address_components) return null;
    const countyComp = place.address_components.find((c) =>
      c.types.includes("administrative_area_level_2")
    );
    return countyComp?.long_name ?? null;
  };

  const handleOriginPlaceChanged = useCallback(() => {
    const place = originAutocompleteRef.current?.getPlace();
    if (!place?.geometry || !place?.formatted_address) {
      onOriginError("⚠️ Invalid address. Please select from the list.");
      onOriginClear();
      return;
    }
    const county = validateCounty(place);
    const isAllowed = ALLOWED_COUNTIES.some((c) => c === county);
    if (!isAllowed) {
      onOriginError(
        `❌ Solo atendemos en Miami-Dade y Broward. (Zona: ${county ?? "Desconocida"})`
      );
      onOriginClear();
      return;
    }
    onOriginValid(place.formatted_address);
  }, [onOriginValid, onOriginError, onOriginClear]);

  const handleDropoffPlaceChanged = useCallback(() => {
    const place = destAutocompleteRef.current?.getPlace();
    if (!place?.geometry || !place?.formatted_address) {
      onDropoffClear();
      return;
    }
    const county = validateCounty(place);
    const isAllowed = ALLOWED_COUNTIES.some((c) => c === county);
    if (!isAllowed) {
      onDropoffError(
        `❌ Solo entregamos en Miami-Dade y Broward. (Zona: ${county ?? "Desconocida"})`
      );
      onDropoffClear();
      return;
    }
    onDropoffValid(place.formatted_address);
  }, [onDropoffValid, onDropoffError, onDropoffClear]);

  const stopColor = serviceType === "SHIPPING" ? "blue" : "green";
  const nextStopLetter = String.fromCharCode(66 + extraStops.length); // B, C, D...

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <h3 className="font-bold text-gmc-gris-oscuro text-sm uppercase tracking-wide">
          {labels.routeTitle}
        </h3>
      </div>

      <div className="relative px-4 py-4 space-y-0">
        {/* ── Línea vertical decorativa ── */}
        <div
          className="absolute left-[30px] top-8 bottom-8 w-px bg-gray-200 z-0 pointer-events-none"
          aria-hidden="true"
        />

        {/* ══ PUNTO A: Pickup ══ */}
        <div className="relative flex items-start gap-3 pb-4">
          <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center shrink-0 z-10 mt-3 shadow-sm">
            <span className="text-white text-[9px] font-black">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
              {labels.pickupPointA}
            </label>
            <Autocomplete
              onLoad={(ref) => { originAutocompleteRef.current = ref; }}
              onPlaceChanged={handleOriginPlaceChanged}
              restrictions={{ country: "us" }}
            >
              <input
                type="text"
                placeholder="Pickup address..."
                autoComplete="off"
                className={[
                  "w-full px-4 py-3 border rounded-xl text-sm font-medium transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-offset-0",
                  addressError
                    ? "border-red-400 bg-red-50 text-red-900 focus:ring-red-300"
                    : "border-gray-200 bg-white text-gray-900 focus:ring-gray-300 focus:border-gray-400",
                ].join(" ")}
                onChange={() => {
                  // El usuario está escribiendo — limpiamos la validación anterior
                  onOriginClear();
                }}
              />
            </Autocomplete>
            {addressError && (
              <div className="mt-1.5 flex items-center gap-1.5 text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg text-xs font-semibold">
                <AlertTriangle size={13} className="shrink-0" />
                <span>{addressError}</span>
              </div>
            )}
          </div>
        </div>

        {/* ══ PARADAS ADICIONALES ══ */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={extraStops.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {extraStops.map((stop, index) => (
              <div key={stop.id} className="relative flex items-start gap-3 pb-4">
                {/* Dot alineado con la línea */}
                <div className="w-6 shrink-0 flex justify-center z-10 mt-3">
                  <div className={[
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center shadow-sm",
                    stopColor === "blue"
                      ? "bg-blue-600 border-blue-600"
                      : "bg-green-600 border-green-600",
                  ].join(" ")}>
                    <span className="text-white text-[8px] font-black">
                      {String.fromCharCode(66 + index)}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <SortableStop
                    stop={stop}
                    index={index}
                    totalStops={extraStops.length}
                    onAddressChange={onStopAddressChange}
                    onDescriptionChange={onStopDescriptionChange}
                    onRemove={onRemoveStop}
                    onRouteRecalc={onRouteRecalc}
                    color={stopColor}
                  />
                </div>
              </div>
            ))}
          </SortableContext>
        </DndContext>

        {/* ══ BOTÓN ADD STOP ══ */}
        <div className="relative flex items-center gap-3 pb-4">
          <div className="w-6 shrink-0 flex justify-center z-10">
            <div className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 bg-white flex items-center justify-center">
              <Plus size={9} className="text-gray-400" />
            </div>
          </div>
          <button
            type="button"
            onClick={onAddStop}
            className={[
              "flex-1 py-2.5 border-2 border-dashed rounded-xl",
              "text-xs font-bold transition-colors duration-150",
              "flex items-center justify-center gap-1.5",
              stopColor === "blue"
                ? "border-gray-200 text-gray-400 hover:border-blue-400 hover:text-blue-500"
                : "border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-500",
            ].join(" ")}
          >
            <Plus size={12} />
            Add Stop ({nextStopLetter})
          </button>
        </div>

        {/* ══ PUNTO FINAL ══ */}
        {serviceType === "SHIPPING" ? (
          /* Bodega GMC */
          <div className="relative flex items-start gap-3">
            <div className="w-6 h-6 rounded-md bg-gray-700 flex items-center justify-center shrink-0 z-10 mt-0.5 shadow-sm">
              <Warehouse size={12} className="text-white" />
            </div>
            <div className="flex-1 p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">
                {labels.interDestTitle}
              </p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">{labels.gmcWarehouse}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{labels.exportNote}</p>
            </div>
          </div>
        ) : (
          /* Dropoff B */
          <div className="relative flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center shrink-0 z-10 mt-3 shadow-sm">
              <span className="text-white text-[9px] font-black">B</span>
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                {labels.dropoffPointB}
              </label>
              <Autocomplete
                onLoad={(ref) => { destAutocompleteRef.current = ref; }}
                onPlaceChanged={handleDropoffPlaceChanged}
                restrictions={{ country: "us" }}
              >
                <input
                  type="text"
                  placeholder="Delivery address..."
                  autoComplete="off"
                  className={[
                    "w-full px-4 py-3 border rounded-xl text-sm font-medium transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-offset-0",
                    dropOffError
                      ? "border-red-400 bg-red-50 text-red-900 focus:ring-red-300"
                      : "border-gray-200 bg-white text-gray-900 focus:ring-green-300 focus:border-green-400",
                  ].join(" ")}
                />
              </Autocomplete>
              {dropOffError && (
                <div className="mt-1.5 flex items-center gap-1.5 text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg text-xs font-semibold">
                  <AlertTriangle size={13} className="shrink-0" />
                  <span>{dropOffError}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Distancia estimada ── */}
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