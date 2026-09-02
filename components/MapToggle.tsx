'use client'

/**
 * MapToggle.tsx
 *
 * Wrapper Client Component que maneja el show/hide del mapa.
 * Importa MapView con dynamic() para no bloquear SSR.
 *
 * Uso en page.tsx (Server Component):
 *   <MapToggle deliveries={mapDeliveries} driverId={driverId} />
 */

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Map, X } from 'lucide-react'
import type { ProcessedDelivery } from './MapView'

// Carga MapView solo en el cliente (Google Maps no funciona en SSR)
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] flex items-center justify-center bg-[#1a2035] rounded-2xl">
      <div className="w-7 h-7 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
})

interface MapToggleProps {
  deliveries: ProcessedDelivery[]
  driverId: string
}

export default function MapToggle({ deliveries, driverId }: MapToggleProps) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      {/* Botón para abrir el mapa — mismo estilo visual que tu UI */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-center gap-2 py-3 px-4
                   bg-[#222b3c] hover:bg-[#2d3a50] text-white text-sm font-semibold
                   rounded-2xl border border-white/10 transition-colors shadow-sm"
      >
        {open ? (
          <>
            <X size={16} className="text-slate-400" />
            Cerrar mapa
          </>
        ) : (
          <>
            <Map size={16} className="text-yellow-400" />
            Ver ruta en mapa
            {deliveries.length > 0 && (
              <span className="ml-1 bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {deliveries.length}
              </span>
            )}
          </>
        )}
      </button>

      {/* Panel del mapa */}
      {open && (
        <div className="mt-3 h-[420px] rounded-2xl overflow-hidden shadow-xl border border-white/5">
          <MapView deliveries={deliveries} driverId={driverId} />
        </div>
      )}
    </div>
  )
}