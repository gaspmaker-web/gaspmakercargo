import type { DeliveryPin, DriverLocation, OptimizedRoute } from '@/types/maps'

export async function fetchOptimizedRoute(
  origin: DriverLocation,
  deliveries: DeliveryPin[]
): Promise<OptimizedRoute | null> {
  const targets = deliveries.filter(d => d.status === 'pending' || d.status === 'in_transit')
  if (targets.length === 0) return null

  const directionsService = new google.maps.DirectionsService()
  const waypoints = targets.slice(0, -1).map(d => ({
    location: new google.maps.LatLng(d.lat, d.lng),
    stopover: true,
  }))
  const destination = targets[targets.length - 1]

  try {
    const result = await directionsService.route({
      origin: new google.maps.LatLng(origin.lat, origin.lng),
      destination: new google.maps.LatLng(destination.lat, destination.lng),
      waypoints,
      optimizeWaypoints: true,
      travelMode: google.maps.TravelMode.DRIVING,
    })

    const route = result.routes[0]
    const order = route.waypoint_order
    const reordered: DeliveryPin[] = [
      ...order.map((i, seq) => ({ ...targets[i], sequence: seq + 1 })),
      { ...destination, sequence: order.length + 1 },
    ]
    const legs = route.legs
    const totalDistance = legs.reduce((acc, l) => acc + (l.distance?.value ?? 0), 0)
    const totalDuration = legs.reduce((acc, l) => acc + (l.duration?.value ?? 0), 0)
    const h = Math.floor(totalDuration / 3600)
    const m = Math.floor((totalDuration % 3600) / 60)

    return {
      waypoints: reordered,
      totalDistance: totalDistance >= 1000 ? `${(totalDistance / 1000).toFixed(1)} km` : `${totalDistance} m`,
      totalDuration: h > 0 ? `${h}h ${m}min` : `${m} min`,
      polyline: route.overview_polyline,
    }
  } catch (err) {
    console.error('[directions]', err)
    return null
  }
}
