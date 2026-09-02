'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { DriverLocation } from '@/types/maps'

interface UseDriverTrackingOptions {
  onLocationUpdate?: (loc: DriverLocation) => void
  pushInterval?: number
}

export function useDriverTracking({
  onLocationUpdate,
  pushInterval = 5000,
}: UseDriverTrackingOptions = {}) {
  const [location, setLocation] = useState<DriverLocation | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const lastPushRef = useRef<number>(0)

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocalización no disponible.')
      return
    }
    setIsTracking(true)
    setError(null)
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc: DriverLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: pos.coords.heading ?? undefined,
          speed: pos.coords.speed ?? undefined,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        }
        setLocation(loc)
        const now = Date.now()
        if (onLocationUpdate && now - lastPushRef.current >= pushInterval) {
          lastPushRef.current = now
          onLocationUpdate(loc)
        }
      },
      (err) => {
        setError(err.code === err.PERMISSION_DENIED ? 'Permiso de ubicación denegado.' : 'Error al obtener ubicación.')
        setIsTracking(false)
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    )
  }, [onLocationUpdate, pushInterval])

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsTracking(false)
  }, [])

  useEffect(() => () => stopTracking(), [stopTracking])

  return { location, isTracking, error, startTracking, stopTracking }
}
