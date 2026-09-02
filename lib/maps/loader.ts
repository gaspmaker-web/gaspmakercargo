let loadPromise: Promise<void> | null = null

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.google?.maps) return Promise.resolve()
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=geometry,places&callback=__gmapsInit`
    script.async = true
    script.defer = true
    ;(window as any).__gmapsInit = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Maps'))
    document.head.appendChild(script)
  })

  return loadPromise
}
