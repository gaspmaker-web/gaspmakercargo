export interface DeliveryPin {
  id: string
  orderId: string
  recipientName: string
  address: string
  lat: number
  lng: number
  status: 'pending' | 'in_transit' | 'delivered' | 'failed'
  sequence?: number
  estimatedArrival?: string
}

export interface DriverLocation {
  lat: number
  lng: number
  heading?: number
  speed?: number
  accuracy?: number
  timestamp: number
}

export interface OptimizedRoute {
  waypoints: DeliveryPin[]
  totalDistance: string
  totalDuration: string
  polyline: string
}
