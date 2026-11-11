import { NextResponse } from 'next/server';

const GKEY = 'AIzaSyD6t34Z-NDhmuyq7AIPSRNCQ0qirQA2j9s';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const input = searchParams.get('input') || '';
  const pid = searchParams.get('place_id') || '';

  if (pid) {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(pid)}&fields=address_components&key=${GKEY}`
    );
    const data = await res.json();
    return NextResponse.json(data);
  }

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=address&key=${GKEY}`
  );
  const data = await res.json();
  return NextResponse.json(data);
}
