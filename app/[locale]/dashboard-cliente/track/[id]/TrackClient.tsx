'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { loadGoogleMaps } from '@/lib/maps/loader'
import { ArrowLeft, MapPin, Navigation, Clock } from 'lucide-react'
import Link from 'next/link'

interface Props {
  requestId: string
  driverId: string
  driverName: string
  origin: string
  destination: string
  status: string
  locale: string
}

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1a2035' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a2035' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a9bb0' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d3548' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3d4f6e' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f1724' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
]

export default function TrackClient({ requestId, driverId, driverName, origin, destination, status, locale }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const driverMarkerRef = useRef<google.maps.Marker | null>(null)
  const [mapsReady, setMapsReady] = useState(false)
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isConnected, setIsConnected] = useState(false)

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
      styles: MAP_STYLES,
    })
  }, [mapsReady])

    // ── Pins de pickup y dropoff ──────────────────────────────────────────────
  useEffect(() => {
    if (!mapsReady || !mapInstanceRef.current) return
    const geocoder = new google.maps.Geocoder()
    const map = mapInstanceRef.current

    const addPin = (address: string, color: string, label: string) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const pos = results[0].geometry.location
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
            <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 24 16 24s16-14 16-24C32 7.163 24.837 0 16 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
            <text x="16" y="20" text-anchor="middle" dominant-baseline="middle" font-family="system-ui" font-size="13" font-weight="700" fill="white">${label}</text>
          </svg>`
          new google.maps.Marker({
            map,
            position: pos,
            icon: {
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
              scaledSize: new google.maps.Size(32, 40),
              anchor: new google.maps.Point(16, 40),
            },
            title: address,
          })
        }
      })
    }

    if (origin) addPin(origin, '#F59E0B', 'P')
    if (destination) addPin(destination, '#10B981', 'D')
  }, [mapsReady, origin, destination])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel(`driver-location:${driverId}`)
    channel.on('broadcast', { event: 'location' }, ({ payload }: any) => {
      const loc = { lat: payload.lat, lng: payload.lng }
      setDriverLocation(loc)
      setLastUpdate(new Date())
      setIsConnected(true)
      updateDriverMarker(loc)
    }).subscribe()

    return () => { channel.unsubscribe() }
  }, [driverId])

  const updateDriverMarker = (loc: { lat: number; lng: number }) => {
    if (!mapInstanceRef.current) return
    const pos = { lat: loc.lat, lng: loc.lng }
    if (!driverMarkerRef.current) {
      const initials = driverName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="20" fill="#222b3c" stroke="#FBBF24" stroke-width="2.5"/>
        <text x="22" y="27" text-anchor="middle" font-family="system-ui" font-size="14" font-weight="700" fill="#FBBF24">${initials}</text>
      </svg>`
      driverMarkerRef.current = new google.maps.Marker({
        map: mapInstanceRef.current,
        position: pos,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
          scaledSize: new google.maps.Size(44, 44),
          anchor: new google.maps.Point(22, 22),
        },
        title: driverName,
        zIndex: 999,
      })
    } else {
      driverMarkerRef.current.setPosition(pos)
    }
    mapInstanceRef.current.panTo(pos)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-3 border-b border-gray-800">
        <Link href={`/${locale}/dashboard-cliente/historial-solicitudes`} className="p-2 rounded-full hover:bg-gray-800 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-sm font-bold">Live Tracking</h1>
          <p className="text-xs text-gray-400">{driverName} · {status}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
          <span className="text-xs text-gray-400">{isConnected ? 'Live' : 'Connecting...'}</span>
        </div>
      </div>

  {/* Map */}
<div style={{ height: "calc(100vh - 180px)", position: "relative" }}>
  {!mapsReady ? (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
    </div>
  ) : (
    <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
  )}
</div>

      {/* Bottom info */}
      <div className="bg-gray-900 border-t border-gray-800 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
            <MapPin size={14} className="text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-500 uppercase font-bold">Pickup</p>
            <p className="text-xs text-gray-200 truncate">{origin}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Navigation size={14} className="text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-500 uppercase font-bold">Dropoff</p>
            <p className="text-xs text-gray-200 truncate">{destination || 'GMC Warehouse'}</p>
          </div>
        </div>
        {lastUpdate && (
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <Clock size={10} />
            Last update: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  )
}
