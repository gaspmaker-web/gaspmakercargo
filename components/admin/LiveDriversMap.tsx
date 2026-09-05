'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { loadGoogleMaps } from '@/lib/maps/loader'

interface DriverLocation {
  driverId: string
  driverName: string
  lat: number
  lng: number
  speed?: number
  timestamp: number
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

export default function LiveDriversMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const [mapsReady, setMapsReady] = useState(false)
  const [drivers, setDrivers] = useState<DriverLocation[]>([])

  useEffect(() => {
    loadGoogleMaps().then(() => setMapsReady(true))
  }, [])

  useEffect(() => {
    if (!mapsReady || !mapRef.current || mapInstanceRef.current) return
    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      zoom: 11,
      center: { lat: 25.7617, lng: -80.1918 },
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: MAP_STYLES,
    })
  }, [mapsReady])

  // Subscribe to all driver location channels via Supabase Realtime
  useEffect(() => {
    const supabase = createClient()

    // Fetch active drivers first
    const fetchDrivers = async () => {
      const res = await fetch('/api/admin/drivers/active')
      const data = await res.json()
      if (data.drivers) {
        data.drivers.forEach((d: any) => {
          subscribeToDriver(d.id, d.name, supabase)
        })
      }
    }

    fetchDrivers()
  }, [])

  const subscribeToDriver = (driverId: string, driverName: string, supabase: any) => {
    const channel = supabase.channel(`driver-location:${driverId}`)
    channel.on('broadcast', { event: 'location' }, ({ payload }: any) => {
      const loc: DriverLocation = {
        driverId,
        driverName,
        lat: payload.lat,
        lng: payload.lng,
        speed: payload.speed,
        timestamp: payload.timestamp,
      }
      setDrivers(prev => {
        const existing = prev.findIndex(d => d.driverId === driverId)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = loc
          return updated
        }
        return [...prev, loc]
      })
      updateMarker(loc)
    }).subscribe()
  }

  const updateMarker = (loc: DriverLocation) => {
    if (!mapInstanceRef.current) return
    const pos = { lat: loc.lat, lng: loc.lng }
    const existing = markersRef.current.get(loc.driverId)

    if (existing) {
      existing.setPosition(pos)
    } else {
      const initials = loc.driverName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="#222b3c" stroke="#FBBF24" stroke-width="2"/>
        <text x="20" y="25" text-anchor="middle" font-family="system-ui" font-size="13" font-weight="700" fill="#FBBF24">${initials}</text>
      </svg>`

      const marker = new google.maps.Marker({
        map: mapInstanceRef.current,
        position: pos,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20),
        },
        title: loc.driverName,
        zIndex: 999,
      })

      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="font-family:system-ui;padding:4px"><p style="font-weight:700;margin:0">${loc.driverName}</p><p style="font-size:11px;color:#6b7280;margin:2px 0 0">Active</p></div>`
      })
      marker.addListener('click', () => infoWindow.open(mapInstanceRef.current, marker))
      markersRef.current.set(loc.driverId, marker)
    }
  }

  if (!mapsReady) {
    return (
      <div className="w-full h-full bg-[#1a2035] rounded-lg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      {drivers.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none">
          <p className="text-sm font-medium">No drivers active</p>
          <p className="text-xs mt-1">Drivers appear when GPS is on</p>
        </div>
      )}
    </div>
  )
}
