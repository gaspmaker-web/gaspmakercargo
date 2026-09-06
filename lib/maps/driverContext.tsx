'use client'

import { createContext, useContext } from 'react'
import type { DriverLocation } from '@/types/maps'

interface DriverContextType {
  location: DriverLocation | null
  isTracking: boolean
  isOnline: boolean
  error: string | null
  goOnline: () => void
  goOffline: () => void
}

export const DriverContext = createContext<DriverContextType>({
  location: null,
  isTracking: false,
  isOnline: false,
  error: null,
  goOnline: () => {},
  goOffline: () => {},
})

export const useDriverContext = () => useContext(DriverContext)
