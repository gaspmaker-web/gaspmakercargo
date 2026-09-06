'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useDriverTracking } from '@/hooks/useDriverTracking'
import { broadcastLocation } from '@/lib/maps/realtimeChannel'
import { loadGoogleMaps } from '@/lib/maps/loader'
import { DriverContext } from '@/lib/maps/driverContext'
import DriverLogoutButton from '@/components/DriverLogoutButton'
import { MapPin, Truck, Home, DollarSign, Bell, Menu } from 'lucide-react'

interface Props {
  driverId: string
  driverName: string
  driverZone: string
  locale: string
  children: React.ReactNode
}

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e8f5' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
]

export default function DriverDashboardWrapper({
  driverId, driverName, driverZone, locale, children,
}: Props) {
  const [isOnline, setIsOnline] = useState(false)
  const [mapsReady, setMapsReady] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const driverMarkerRef = useRef<google.maps.Marker | null>(null)

  const handleLocationUpdate = useCallback(
    (loc: Parameters<typeof broadcastLocation>[1]) => {
      broadcastLocation(driverId, loc)
      if (mapInstanceRef.current && !isOnline) {
        const pos = { lat: loc.lat, lng: loc.lng }
        if (!driverMarkerRef.current) {
          driverMarkerRef.current = new google.maps.Marker({
            map: mapInstanceRef.current,
            position: pos,
            icon: {
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 6,
              fillColor: '#F4DBA7',
              fillOpacity: 1,
              strokeColor: '#222b3c',
              strokeWeight: 2,
            },
            zIndex: 999,
          })
        } else {
          driverMarkerRef.current.setPosition(pos)
        }
        mapInstanceRef.current.panTo(pos)
      }
    },
    [driverId, isOnline]
  )

  const { location, isTracking, error, startTracking, stopTracking } = useDriverTracking({
    onLocationUpdate: handleLocationUpdate,
    pushInterval: 5000,
  })

  useEffect(() => {
    loadGoogleMaps().then(() => setMapsReady(true))
  }, [])

  useEffect(() => {
    if (!mapsReady || !mapRef.current || mapInstanceRef.current) return
    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      zoom: 13,
      center: { lat: 25.7617, lng: -80.1918 },
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: false,
      styles: MAP_STYLES,
    })
  }, [mapsReady])

  const goOnline = useCallback(() => {
    setIsOnline(true)
    startTracking()
  }, [startTracking])

  const goOffline = useCallback(() => {
    setIsOnline(false)
    stopTracking()
  }, [stopTracking])

  const initials = driverName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  const contextValue = { location, isTracking, isOnline, error, goOnline, goOffline }

  // ── OFFLINE SCREEN ──────────────────────────────────────────────────────
  if (!isOnline) {
    return (
      <DriverContext.Provider value={contextValue}>
        <div className="min-h-screen bg-white flex flex-col font-sans">
          {/* Header */}
          <div className="flex justify-between items-center px-5 pt-10 pb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">You're offline</h1>
              <p className="text-gray-400 mt-1 text-sm">Ready to go?</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#222b3c] flex items-center justify-center text-sm font-bold" style={{ color: '#F4DBA7' }}>
                {initials}
              </div>
              <DriverLogoutButton locale={locale} />
            </div>
          </div>

          {/* Zone */}
          <div className="px-5 mb-3">
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <MapPin size={14} style={{ color: '#b8993e' }} />
              Operational Zone: <span className="font-bold text-gray-800 ml-1">{driverZone}</span>
            </div>
          </div>

          {/* Map */}
          <div className="mx-4 rounded-3xl overflow-hidden h-64 relative">
            {mapsReady ? (
              <div ref={mapRef} className="w-full h-full" />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <div className="absolute top-3 left-3 bg-gray-900/80 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-gray-400" />
              <span className="text-xs text-gray-300 font-medium">Offline</span>
            </div>
          </div>

          {/* Opportunities placeholder */}
          <div className="px-5 mt-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-800 text-lg">Opportunities</h2>
              <span className="text-xs text-gray-400">Go online to see</span>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 text-center border-2 border-dashed border-gray-200">
              <Truck size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">Go online to receive delivery opportunities</p>
            </div>
          </div>

          {/* Go Online button */}
          <div className="flex-1 flex flex-col justify-end px-4 pb-4 mt-4">
            {error && <p className="text-red-500 text-xs text-center mb-3">{error}</p>}
            <button
              onClick={goOnline}
              className="w-full py-5 text-white text-lg font-bold rounded-2xl transition-colors flex items-center justify-center gap-3 shadow-lg"
              style={{ backgroundColor: '#222b3c' }}
            >
              <Truck size={22} style={{ color: '#F4DBA7' }} />
              Go online
            </button>
          </div>

          {/* Bottom nav */}
          <div className="flex items-center justify-around px-4 py-4 border-t border-gray-100">
            {[
              { icon: Home, label: 'Home', active: true },
              { icon: DollarSign, label: 'Earnings' },
              { icon: Bell, label: 'Inbox' },
              { icon: Menu, label: 'Menu' },
            ].map(({ icon: Icon, label, active }) => (
              <button key={label} className="flex flex-col items-center gap-1">
                <Icon size={22} className={active ? '' : 'text-gray-400'} style={active ? { color: '#222b3c' } : {}} />
                <span className={`text-[10px] font-medium ${active ? '' : 'text-gray-400'}`} style={active ? { color: '#222b3c' } : {}}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </DriverContext.Provider>
    )
  }

  // ── ONLINE ──────────────────────────────────────────────────────────────
  return (
    <DriverContext.Provider value={contextValue}>
      <div className="relative">
        <div className="text-white text-xs font-bold text-center py-2 flex items-center justify-center gap-2" style={{ backgroundColor: '#222b3c' }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#F4DBA7' }} />
          <span style={{ color: '#F4DBA7' }}>GPS Active · You're online</span>
          <button
            onClick={goOffline}
            className="ml-4 bg-white/10 hover:bg-white/20 px-3 py-0.5 rounded-full text-[10px] transition-colors text-white"
          >
            Go offline
          </button>
        </div>
        {children}
      </div>
    </DriverContext.Provider>
  )
}
