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
  const bgWatcherRef = useRef<string | null>(null)

  const startTracking = useCallback(async () => {
    setIsTracking(true)
    setError(null)

    const handleLocation = (loc: DriverLocation) => {
      setLocation(loc)
      const now = Date.now()
      if (onLocationUpdate && now - lastPushRef.current >= pushInterval) {
        lastPushRef.current = now
        onLocationUpdate(loc)
      }
    }

    // Try Capacitor background geolocation first (native Android/iOS)
    try {
      const { registerPlugin, Capacitor } = await import('@capacitor/core')
      if (Capacitor.isNativePlatform()) {
        type BGPlugin = {
          addWatcher: (options: any, callback: (pos: any, err: any) => void) => Promise<string>
          removeWatcher: (options: { id: string }) => Promise<void>
        }
        const BackgroundGeolocation = registerPlugin<BGPlugin>('BackgroundGeolocation')
        const id = await BackgroundGeolocation.addWatcher(
          {
            backgroundMessage: 'Gasp Maker está rastreando tu ubicación para entregas.',
            backgroundTitle: 'Rastreo activo',
            requestPermissions: true,
            stale: false,
            distanceFilter: 10,
          },
          (position: any, err: any) => {
            if (err) { setError('Error al obtener ubicación.'); return }
            if (position) {
              handleLocation({
                lat: position.latitude,
                lng: position.longitude,
                heading: position.bearing ?? undefined,
                speed: position.speed ?? undefined,
                accuracy: position.accuracy,
                timestamp: position.time,
              })
            }
          }
        )
        bgWatcherRef.current = id
        return
      }
    } catch {
      // Fallback to browser geolocation
    }

    // Browser fallback
    if (!navigator.geolocation) {
      setError('Geolocalización no disponible.')
      return
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        handleLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: pos.coords.heading ?? undefined,
          speed: pos.coords.speed ?? undefined,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        })
      },
      (err) => {
        setError(err.code === err.PERMISSION_DENIED ? 'Permiso de ubicación denegado.' : 'Error al obtener ubicación.')
        setIsTracking(false)
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    )
  }, [onLocationUpdate, pushInterval])

  const stopTracking = useCallback(async () => {
    if (bgWatcherRef.current !== null) {
      try {
        const { registerPlugin } = await import('@capacitor/core')
        type BGPlugin = { removeWatcher: (options: { id: string }) => Promise<void> }
        const BackgroundGeolocation = registerPlugin<BGPlugin>('BackgroundGeolocation')
        await BackgroundGeolocation.removeWatcher({ id: bgWatcherRef.current })
        bgWatcherRef.current = null
      } catch {}
    }
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsTracking(false)
  }, [])

  useEffect(() => () => { stopTracking() }, [stopTracking])

  return { location, isTracking, error, startTracking, stopTracking }
}
