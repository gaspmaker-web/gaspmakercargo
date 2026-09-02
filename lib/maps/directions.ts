import type { DeliveryPin, DriverLocation, OptimizedRoute } from '@/types/maps'

function isCaribbean(lat: number, lng: number): boolean {
  console.log(`[isCaribbean] lat=${lat} lng=${lng} result=${lat < 25 && lat > 9 && lng < -59 && lng > -90}`)
  return lat < 25 && lat > 9 && lng < -59 && lng > -90
}

function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}min` : `${m} min`
}

export async function fetchOptimizedRoute(
  origin: DriverLocation,
  deliveries: DeliveryPin[]
): Promise<OptimizedRoute | null> {
  const targets = deliveries.filter(
    (d) => d.status === 'pending' || d.status === 'in_transit'
  )
  if (targets.length === 0) return null

  if (isCaribbean(origin.lat, origin.lng)) {
    return fetchRouteWithHERE(origin, targets)
  }

  return fetchRouteWithGoogle(origin, targets)
}

async function fetchRouteWithGoogle(
  origin: DriverLocation,
  targets: DeliveryPin[]
): Promise<OptimizedRoute | null> {
  const directionsService = new google.maps.DirectionsService()
  const waypoints = targets.slice(0, -1).map((d) => ({
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

    return {
      waypoints: reordered,
      totalDistance: formatDistance(totalDistance),
      totalDuration: formatDuration(totalDuration),
      polyline: route.overview_polyline,
    }
  } catch (err) {
    console.error('[directions/google]', err)
    return null
  }
}

async function fetchRouteWithHERE(
  origin: DriverLocation,
  targets: DeliveryPin[]
): Promise<OptimizedRoute | null> {
  try {
    const destination = targets[targets.length - 1]
    const waypoints = targets.slice(0, -1).map((d) => ({ lat: d.lat, lng: d.lng }))

    const res = await fetch('/api/maps/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: { lat: origin.lat, lng: origin.lng },
        waypoints,
        destination: { lat: destination.lat, lng: destination.lng },
      }),
    })

    if (!res.ok) return null
    const data = await res.json()

    const reordered = targets.map((d, i) => ({ ...d, sequence: i + 1 }))

    return {
      waypoints: reordered,
      totalDistance: formatDistance(data.totalDistance),
      totalDuration: formatDuration(data.totalDuration),
      polyline: data.polyline ?? '',
    }
  } catch (err) {
    console.error('[directions/here]', err)
    return null
  }
}
