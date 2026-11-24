import { NextResponse } from 'next/server';

const WAREHOUSE    = '1861 NW 22nd St, Miami, FL 33142';
const ROUTES_URL   = 'https://routes.googleapis.com/directions/v2:computeRoutes';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const destination = searchParams.get('destination')?.trim();
  const origin      = searchParams.get('origin')?.trim() || WAREHOUSE;

  if (!destination) {
    return NextResponse.json(
      { error: 'missing_destination', message: 'destination query param is required' },
      { status: 400 },
    );
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
               ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error('[distance] NEXT_PUBLIC_GOOGLE_MAPS_KEY not set');
    return NextResponse.json(
      { error: 'server_misconfiguration' },
      { status: 500 },
    );
  }

  const body = {
    origin:      { address: origin },
    destination: { address: destination },
    travelMode:  'DRIVE',
    routingPreference: 'TRAFFIC_AWARE',
    computeAlternativeRoutes: false,
    units: 'IMPERIAL',
  };

  let res: Response;
  try {
    res = await fetch(ROUTES_URL, {
      method:  'POST',
      headers: {
        'Content-Type':          'application/json',
        'X-Goog-Api-Key':        apiKey,
        'X-Goog-FieldMask':      'routes.distanceMeters,routes.duration,routes.staticDuration',
      },
      body: JSON.stringify(body),
    });
  } catch (networkErr) {
    console.error('[distance] network error calling Routes API', networkErr);
    return NextResponse.json(
      { error: 'upstream_unavailable', miles: 0, distanceMiles: 0 },
      { status: 502 },
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error(`[distance] Routes API ${res.status}`, text);
    return NextResponse.json(
      { error: 'upstream_error', upstream_status: res.status, miles: 0, distanceMiles: 0 },
      { status: 502 },
    );
  }

  const data = await res.json();
  const route = data?.routes?.[0];

  if (!route?.distanceMeters) {
    return NextResponse.json({ miles: 0, distanceMiles: 0 });
  }

  const miles = parseFloat((route.distanceMeters / 1609.34).toFixed(2));

  return NextResponse.json({
    miles,
    distanceMiles: miles,
    durationSeconds: route.staticDuration
      ? parseInt(route.staticDuration.replace('s', ''), 10)
      : null,
  });
}
