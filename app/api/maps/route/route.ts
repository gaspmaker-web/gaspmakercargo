import { NextResponse } from 'next/server'

interface Waypoint {
  lat: number
  lng: number
}

export async function POST(req: Request) {
  try {
    const { origin, waypoints, destination } = await req.json()

    if (!origin || !destination) {
      return NextResponse.json({ error: 'Missing origin or destination' }, { status: 400 })
    }

    const apiKey = process.env.HERE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'HERE API key not configured' }, { status: 500 })
    }

    const viaParts = (waypoints ?? [])
      .map((w: Waypoint) => `via=${w.lat},${w.lng}`)
      .join('&')

    const url = `https://router.hereapi.com/v8/routes?transportMode=car&origin=${origin.lat},${origin.lng}${viaParts ? '&' + viaParts : ''}&destination=${destination.lat},${destination.lng}&return=summary,polyline&apiKey=${apiKey}`

    const res = await fetch(url)
    const data = await res.json()

    if (!data.routes || data.routes.length === 0) {
      return NextResponse.json({ error: 'No route found' }, { status: 404 })
    }

    const route = data.routes[0]
    const summary = route.sections.reduce(
      (acc: { length: number; duration: number }, s: any) => ({
        length: acc.length + s.summary.length,
        duration: acc.duration + s.summary.duration,
      }),
      { length: 0, duration: 0 }
    )

    return NextResponse.json({
      totalDistance: summary.length,
      totalDuration: summary.duration,
      polyline: route.sections[0]?.polyline ?? '',
    })
  } catch (err) {
    console.error('[route/here]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
