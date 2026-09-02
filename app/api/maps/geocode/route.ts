import { NextResponse } from 'next/server'
import { geocodeAddress } from '@/lib/maps/geocoder'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')
  const countryCode = searchParams.get('countryCode') || undefined

  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 })
  }

  const coords = await geocodeAddress(address, countryCode)

  if (!coords) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(coords)
}
