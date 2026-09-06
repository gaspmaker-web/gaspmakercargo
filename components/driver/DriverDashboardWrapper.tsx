'use client'

import { useState, useCallback } from 'react'
import { useDriverTracking } from '@/hooks/useDriverTracking'
import { broadcastLocation } from '@/lib/maps/realtimeChannel'
import DriverLogoutButton from '@/components/DriverLogoutButton'
import { MapPin, Truck, Wifi, WifiOff } from 'lucide-react'

interface Props {
  driverId: string
  driverName: string
  driverZone: string
  locale: string
  children: React.ReactNode
}

export default function DriverDashboardWrapper({
  driverId,
  driverName,
  driverZone,
  locale,
  children,
}: Props) {
  const [isOnline, setIsOnline] = useState(false)

  const handleLocationUpdate = useCallback(
    (loc: Parameters<typeof broadcastLocation>[1]) => {
      broadcastLocation(driverId, loc)
    },
    [driverId]
  )

  const { isTracking, error, startTracking, stopTracking } = useDriverTracking({
    onLocationUpdate: handleLocationUpdate,
    pushInterval: 5000,
  })

  const goOnline = () => {
    setIsOnline(true)
    startTracking()
  }

  const goOffline = () => {
    setIsOnline(false)
    stopTracking()
  }

  // ── OFFLINE SCREEN ────────────────────────────────────────────────────────
  if (!isOnline) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        {/* Header */}
        <div className="flex justify-between items-center px-5 pt-10 pb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">You're offline</h1>
            <p className="text-gray-400 mt-1 text-sm">Go online to see opportunities.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#222b3c] flex items-center justify-center text-white text-sm font-bold">
              {driverName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <DriverLogoutButton locale={locale} />
          </div>
        </div>

        {/* Zone */}
        <div className="px-5 mb-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <MapPin size={14} className="text-yellow-500" />
            Operational Zone: <span className="font-bold text-gray-800">{driverZone}</span>
          </div>
        </div>

        {/* Map placeholder */}
        <div className="mx-4 rounded-3xl overflow-hidden h-64 bg-gray-100 relative flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-blue-50" />
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center mx-auto mb-3">
              <Truck size={28} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-400 font-medium">GPS inactive</p>
          </div>
          {/* Offline badge */}
          <div className="absolute top-4 left-4 bg-gray-800/80 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <WifiOff size={12} className="text-gray-400" />
            <span className="text-xs text-gray-300 font-medium">Offline</span>
          </div>
        </div>

        {/* Opportunities placeholder */}
        <div className="px-5 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800">Opportunities</h2>
            <span className="text-xs text-gray-400">Go online to see</span>
          </div>
          <div className="bg-gray-50 rounded-2xl p-8 text-center border-2 border-dashed border-gray-200">
            <Truck size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">Go online to receive delivery opportunities</p>
          </div>
        </div>

        {/* Go Online button */}
        <div className="flex-1 flex flex-col justify-end px-4 pb-10 mt-6">
          {error && <p className="text-red-500 text-xs text-center mb-3">{error}</p>}
          <button
            onClick={goOnline}
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-lg font-bold rounded-2xl transition-colors flex items-center justify-center gap-3 shadow-lg shadow-blue-200"
          >
            <Truck size={22} />
            Go online
          </button>
        </div>
      </div>
    )
  }

  // ── ONLINE — full dashboard ───────────────────────────────────────────────
  return (
    <div className="relative">
      {/* Online indicator bar */}
      <div className="bg-green-500 text-white text-xs font-bold text-center py-1.5 flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        GPS Active · You're online
        <button
          onClick={goOffline}
          className="ml-4 bg-white/20 hover:bg-white/30 px-3 py-0.5 rounded-full text-[10px] transition-colors"
        >
          Go offline
        </button>
      </div>
      {children}
    </div>
  )
}
