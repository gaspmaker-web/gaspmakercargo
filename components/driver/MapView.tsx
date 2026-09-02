'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { loadGoogleMaps } from '@/lib/maps/loader'
import { useDriverTracking } from '@/hooks/useDriverTracking'
import { broadcastLocation } from '@/lib/maps/realtimeChannel'
import { fetchOptimizedRoute } from '@/lib/maps/directions'
import type { DeliveryPin, OptimizedRoute } from '@/types/maps'
import { MapPin, Navigation, RotateCcw } from 'lucide-react'
import type { PickupTask } from './MapToggle'

export interface ProcessedDelivery {
  id: string
  type: 'LOCAL_DELIVERY' | 'CONSOLIDATION' | 'PACKAGE'
  tracking: string
  userName: string
  address: string
  count: number
  weightLbs: number
  childTrackings: string[]
  countryCode?: string | null
  lat?: number | null
  lng?: number | null
}

interface MapViewProps {
  deliveries: ProcessedDelivery[]
  pickupTasks: PickupTask[]
  driverId: string
}

const TYPE_COLORS: Record<ProcessedDelivery['type'], string> = {
  LOCAL_DELIVERY: '#111827',
  CONSOLIDATION:  '#7C3AED',
  PACKAGE:        '#3B82F6',
}

const TYPE_LABELS: Record<ProcessedDelivery['type'], string> = {
  LOCAL_DELIVERY: 'Pallet Aura',
  CONSOLIDATION:  'Consolidated',
  PACKAGE:        'Package',
}

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry',            stylers: [{ color: '#1a2035' }] },
  { elementType: 'labels.text.stroke',  stylers: [{ color: '#1a2035' }] },
  { elementType: 'labels.text.fill',    stylers: [{ color: '#8a9bb0' }] },
  { featureType: 'road', elementType: 'geometry',         stylers: [{ color: '#2d3548' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3d4f6e' }] },
  { featureType: 'water', elementType: 'geometry',        stylers: [{ color: '#0f1724' }] },
  { featureType: 'poi',   elementType: 'labels',          stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',                               stylers: [{ visibility: 'off' }] },
]

export default function MapView({ deliveries, pickupTasks, driverId }: MapViewProps) {
  const mapRef          = useRef<HTMLDivElement>(null)
  const mapInstanceRef  = useRef<google.maps.Map | null>(null)
  const driverMarkerRef = useRef<google.maps.Marker | null>(null)
  const pinMarkersRef   = useRef<Map<string, google.maps.Marker>>(new Map())
  const rendererRef     = useRef<google.maps.DirectionsRenderer | null>(null)
  const infoWindowRef   = useRef<google.maps.InfoWindow | null>(null)

  const [mapsReady,    setMapsReady]    = useState(false)
  const [routeInfo,    setRouteInfo]    = useState<OptimizedRoute | null>(null)
  const [loadingRoute, setLoadingRoute] = useState(false)
  const [pins,         setPins]         = useState<DeliveryPin[]>([])

  const handleLocationUpdate = useCallback(
    (loc: Parameters<typeof broadcastLocation>[1]) => broadcastLocation(driverId, loc),
    [driverId]
  )

  const { location, isTracking, error, startTracking, stopTracking } = useDriverTracking({
    onLocationUpdate: handleLocationUpdate,
    pushInterval: 5000,
  })

  useEffect(() => { loadGoogleMaps().then(() => setMapsReady(true)) }, [])

  useEffect(() => {
    if (!mapsReady || !mapRef.current || mapInstanceRef.current) return
    const map = new google.maps.Map(mapRef.current, {
      zoom: 12,
      center: { lat: 25.7617, lng: -80.1918 },
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: MAP_STYLES,
    })
    rendererRef.current = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: { strokeColor: '#FBBF24', strokeWeight: 4, strokeOpacity: 0.9 },
    })
    infoWindowRef.current = new google.maps.InfoWindow()
    mapInstanceRef.current = map
  }, [mapsReady])

  // ── Geocodificar deliveries + pickup tasks ────────────────────────────────
  useEffect(() => {
    if (!mapsReady) return

    const geocoder = new google.maps.Geocoder()

    const deliveryPromises = deliveries.map(
      (d) => new Promise<DeliveryPin>(async (resolve) => {
        if (d.lat && d.lng) {
          resolve({ id: d.id, orderId: d.tracking, recipientName: d.userName, address: d.address, lat: d.lat, lng: d.lng, status: 'pending' })
          return
        }
        if (d.countryCode && d.countryCode.toUpperCase() !== 'US') {
          try {
            const res = await fetch(`/api/maps/geocode?address=${encodeURIComponent(d.address)}&countryCode=${d.countryCode}`)
            const data = await res.json()
            if (data.lat && data.lng) {
              resolve({ id: d.id, orderId: d.tracking, recipientName: d.userName, address: d.address, lat: data.lat, lng: data.lng, status: 'pending' })
              return
            }
          } catch {}
        }
        geocoder.geocode({ address: d.address }, (results, status) => {
          const loc = status === 'OK' && results?.[0]?.geometry?.location
            ? { lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng() }
            : { lat: 25.7617 + Math.random() * 0.05, lng: -80.1918 + Math.random() * 0.05 }
          resolve({ id: d.id, orderId: d.tracking, recipientName: d.userName, address: d.address, lat: loc.lat, lng: loc.lng, status: 'pending' })
        })
      })
    )

    // Cada pickup genera 2 pins: origen y destino
    const pickupPromises = pickupTasks.flatMap((task) => {
      const fallbackOrigin = { lat: 25.7617 + Math.random() * 0.05, lng: -80.1918 + Math.random() * 0.05 }
      const fallbackDest   = { lat: 25.7617 + Math.random() * 0.05, lng: -80.1918 + Math.random() * 0.05 }

      const originCoords = task.lat && task.lng
        ? { lat: task.lat, lng: task.lng }
        : fallbackOrigin

      const originPin: DeliveryPin = {
        id: `${task.id}-origin`,
        orderId: task.id,
        recipientName: '📦 Pickup',
        address: task.originAddress,
        lat: originCoords.lat,
        lng: originCoords.lng,
        status: 'in_transit',
      }

      const destPin: DeliveryPin | null = task.dropOffAddress
        ? {
            id: `${task.id}-dest`,
            orderId: task.id,
            recipientName: '🏁 Delivery',
            address: task.dropOffAddress,
            lat: task.latDest ?? fallbackDest.lat,
            lng: task.lngDest ?? fallbackDest.lng,
            status: 'pending',
          }
        : null

      return destPin ? [originPin, destPin] : [originPin]
    })

    Promise.all([...deliveryPromises, ...pickupPromises]).then(setPins)
  }, [mapsReady, deliveries, pickupTasks])

  // ── Colocar pins en el mapa ───────────────────────────────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current || pins.length === 0) return
    const map = mapInstanceRef.current
    const existing = pinMarkersRef.current

    pins.forEach((pin, idx) => {
      const isPickupOrigin = pin.id.endsWith('-origin')
      const isPickupDest   = pin.id.endsWith('-dest')
      const color = isPickupOrigin ? '#F59E0B' : isPickupDest ? '#10B981' : TYPE_COLORS[(deliveries.find(d => d.id === pin.id)?.type ?? 'PACKAGE')]
      const label = isPickupOrigin ? 'P' : isPickupDest ? 'D' : (idx + 1).toString()

      if (existing.has(pin.id)) {
        existing.get(pin.id)!.setPosition({ lat: pin.lat, lng: pin.lng })
      } else {
        const marker = new google.maps.Marker({
          map, position: { lat: pin.lat, lng: pin.lng },
          icon: buildPinIcon(color, label), title: pin.recipientName,
        })
        marker.addListener('click', () => {
          infoWindowRef.current?.setContent(buildPickupInfoWindow(pin))
          infoWindowRef.current?.open(map, marker)
        })
        existing.set(pin.id, marker)
      }
    })

    const bounds = new google.maps.LatLngBounds()
    pins.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }))
    if (location) bounds.extend({ lat: location.lat, lng: location.lng })
    map.fitBounds(bounds, 60)
  }, [pins, deliveries, location])

  // ── Marcador del conductor ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current || !location) return
    const pos = { lat: location.lat, lng: location.lng }
    if (!driverMarkerRef.current) {
      driverMarkerRef.current = new google.maps.Marker({
        map: mapInstanceRef.current, position: pos,
        icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 7, fillColor: '#FBBF24', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2, rotation: location.heading ?? 0 },
        title: 'Mi ubicación', zIndex: 999,
      })
    } else {
      driverMarkerRef.current.setPosition(pos)
      const icon = driverMarkerRef.current.getIcon() as google.maps.Symbol
      driverMarkerRef.current.setIcon({ ...icon, rotation: location.heading ?? 0 })
    }
  }, [location])

  const calculateRoute = useCallback(async () => {
    if (!location || !mapInstanceRef.current || pins.length === 0) return
    setLoadingRoute(true)
    const route = await fetchOptimizedRoute(location, pins)
    if (route) {
      setRouteInfo(route)
      const svc = new google.maps.DirectionsService()
      const waypoints = route.waypoints.slice(0, -1).map((wp) => ({
        location: new google.maps.LatLng(wp.lat, wp.lng), stopover: true,
      }))
      const last = route.waypoints[route.waypoints.length - 1]
      svc.route(
        { origin: new google.maps.LatLng(location.lat, location.lng), destination: new google.maps.LatLng(last.lat, last.lng), waypoints, travelMode: google.maps.TravelMode.DRIVING },
        (result, status) => { if (status === 'OK' && result) rendererRef.current?.setDirections(result) }
      )
    }
    setLoadingRoute(false)
  }, [location, pins])

  if (!mapsReady) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1a2035] rounded-2xl">
        <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />

      <div className="absolute top-3 left-3 right-3 flex items-center gap-2">
        <div className="flex items-center gap-2 bg-[#222b3c]/90 backdrop-blur px-3 py-2 rounded-full shadow-lg text-xs">
          <span className="relative flex h-2 w-2">
            {isTracking && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isTracking ? 'bg-yellow-400' : 'bg-slate-600'}`} />
          </span>
          <span className="text-slate-300">{isTracking ? 'GPS active' : 'GPS inactive'}</span>
        </div>
        <button onClick={isTracking ? stopTracking : startTracking}
          className={`ml-auto px-3 py-2 rounded-full text-xs font-medium shadow-lg transition-colors ${isTracking ? 'bg-slate-700 text-slate-300' : 'bg-yellow-400 text-black'}`}>
          {isTracking ? 'Pause' : 'Start GPS'}
        </button>
      </div>

      <div className="absolute top-14 right-3 bg-[#222b3c]/90 backdrop-blur rounded-xl p-3 shadow-lg">
        <p className="text-[10px] font-semibold text-slate-500 uppercase mb-2">Legend</p>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-amber-400" />
          <span className="text-[11px] text-slate-300">P — Pickup</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-emerald-500" />
          <span className="text-[11px] text-slate-300">D — Delivery</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-purple-600" />
          <span className="text-[11px] text-slate-300">Consolidated</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-blue-500" />
          <span className="text-[11px] text-slate-300">Package</span>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <button onClick={calculateRoute} disabled={loadingRoute || !location || pins.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-black text-sm font-bold rounded-full shadow-xl transition-colors">
          {loadingRoute ? <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Navigation size={15} />}
          Optimize route
        </button>
        {routeInfo && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#222b3c]/90 backdrop-blur text-white text-xs rounded-full shadow-xl">
            <MapPin size={12} className="text-yellow-400" />
            <span>{routeInfo.totalDistance}</span>
            <span className="text-slate-600">·</span>
            <span>{routeInfo.totalDuration}</span>
            <button onClick={() => { setRouteInfo(null); rendererRef.current?.setDirections(null as any) }}>
              <RotateCcw size={12} className="text-slate-500 hover:text-slate-300" />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-900/90 text-red-300 text-xs rounded-full">
          {error}
        </div>
      )}
    </div>
  )
}

function buildPinIcon(color: string, label: string): google.maps.Icon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40"><path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 24 16 24s16-14 16-24C32 7.163 24.837 0 16 0z" fill="${color}" stroke="white" stroke-width="1.5"/><text x="16" y="20" text-anchor="middle" dominant-baseline="middle" font-family="system-ui" font-size="13" font-weight="700" fill="white">${label}</text></svg>`
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(32, 40),
    anchor: new google.maps.Point(16, 40),
  }
}

function buildPickupInfoWindow(pin: DeliveryPin): string {
  const isOrigin = pin.id.endsWith('-origin')
  const color = isOrigin ? '#F59E0B' : '#10B981'
  const label = isOrigin ? 'Punto de Pickup' : 'Punto de Delivery'
  return `<div style="font-family:system-ui;padding:4px 2px;min-width:180px"><div style="display:flex;align-items:center;gap:6px;margin-bottom:6px"><span style="background:${color};color:white;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;">${label}</span></div><p style="font-size:12px;color:#6b7280;margin:0">${pin.address}</p></div>`
}
