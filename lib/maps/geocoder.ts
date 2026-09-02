/**
 * geocoder.ts
 * Universal geocoder:
 * - US addresses → Google Maps Geocoding API
 * - Caribbean (BB, TT, JM, etc.) → HERE Geocoding API
 */

interface Coordinates {
  lat: number
  lng: number
}

const COUNTRY_CENTERS: Record<string, Coordinates> = {
  BB: { lat: 13.1939, lng: -59.5432 }, // Barbados
  TT: { lat: 10.6918, lng: -61.2225 }, // Trinidad & Tobago
  JM: { lat: 18.1096, lng: -77.2975 }, // Jamaica
  GY: { lat: 4.8604,  lng: -58.9302 }, // Guyana
  LC: { lat: 13.9094, lng: -60.9789 }, // Saint Lucia
  VC: { lat: 13.2528, lng: -61.1971 }, // Saint Vincent
  GD: { lat: 12.1165, lng: -61.6790 }, // Grenada
}

export async function geocodeAddress(
  address: string,
  countryCode?: string
): Promise<Coordinates | null> {
  // Caribbean countries → HERE Maps
  if (countryCode && countryCode.toUpperCase() !== 'US') {
    return geocodeWithHERE(address, countryCode)
  }

  // US → Google Maps
  return geocodeWithGoogle(address)
}

async function geocodeWithGoogle(address: string): Promise<Coordinates | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`
    const res = await fetch(url)
    const data = await res.json()
    if (data.status === 'OK' && data.results[0]) {
      return data.results[0].geometry.location
    }
    return null
  } catch {
    return null
  }
}

async function geocodeWithHERE(address: string, countryCode: string): Promise<Coordinates | null> {
  try {
    const country = countryCode.toUpperCase()
    const query = `${address}, ${country}`
    const url = `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(query)}&apiKey=${process.env.HERE_API_KEY}`
    const res = await fetch(url)
    const data = await res.json()

    if (data.items && data.items.length > 0) {
      const pos = data.items[0].position
      return { lat: pos.lat, lng: pos.lng }
    }

    // Fallback al centro del país
    return COUNTRY_CENTERS[country] ?? null
  } catch {
    // Fallback al centro del país
    const country = countryCode.toUpperCase()
    return COUNTRY_CENTERS[country] ?? null
  }
}
