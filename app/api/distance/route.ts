import { NextResponse } from 'next/server';

const GKEY = 'AIzaSyD6t34Z-NDhmuyq7AIPSRNCQ0qirQA2j9s';
const WAREHOUSE = '1861 NW 22nd St, Miami, FL 33142';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const destination = searchParams.get('destination') || '';
  if (!destination) return NextResponse.json({ error: 'missing destination' }, { status: 400 });

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(WAREHOUSE)}&destinations=${encodeURIComponent(destination)}&travelMode=driving&units=imperial&key=${GKEY}`;
  const res = await fetch(url);
  const data = await res.json();

  const el = data.rows?.[0]?.elements?.[0];
  if (!el || el.status !== 'OK') return NextResponse.json({ miles: 0 });

  const miles = el.distance?.text?.includes('mi')
    ? parseFloat(el.distance.text.replace(' mi', '').replace(',', ''))
    : (el.distance?.value || 0) / 1609.34;

  return NextResponse.json({ miles: parseFloat(miles.toFixed(2)) });
}
