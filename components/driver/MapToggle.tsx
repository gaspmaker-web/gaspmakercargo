'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Map, X } from 'lucide-react'
import type { ProcessedDelivery } from './MapView'

export interface PickupTask {
  lat: number | null
  lng: number | null
  latDest: number | null
  lngDest: number | null
  id: string
  originAddress: string
  originCity: string
  dropOffAddress: string | null
  dropOffCity: string | null
  status: string
}

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
  pickupTasks: PickupTask[]
  driverId: string
}

export default function MapToggle({ deliveries, pickupTasks, driverId }: MapToggleProps) {
  const [open, setOpen] = useState(false)

  const totalPins = deliveries.length + pickupTasks.length

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-center gap-2 py-3 px-4
                   bg-[#222b3c] hover:bg-[#2d3a50] text-white text-sm font-semibold
                   rounded-2xl border border-white/10 transition-colors shadow-sm"
      >
        {open ? (
          <>
            <X size={16} className="text-slate-400" />
            Close map
          </>
        ) : (
          <>
            <Map size={16} className="text-yellow-400" />
            View route on map
            {totalPins > 0 && (
              <span className="ml-1 bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {totalPins}
              </span>
            )}
          </>
        )}
      </button>

      {open && (
        <div className="mt-3 h-[420px] rounded-2xl overflow-hidden shadow-xl border border-white/5">
          <MapView deliveries={deliveries} pickupTasks={pickupTasks} driverId={driverId} />
        </div>
      )}
    </div>
  )
}
