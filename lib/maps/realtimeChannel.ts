import { createClient } from '@/lib/supabase/client'
import type { DriverLocation } from '@/types/maps'

let channel: any = null

export function getDriverChannel(driverId: string) {
  if (channel) return channel
  const supabase = createClient()
  channel = supabase.channel(`driver-location:${driverId}`)
  channel.subscribe()
  return channel
}

export async function broadcastLocation(driverId: string, loc: DriverLocation) {
  const ch = getDriverChannel(driverId)
  await ch.send({ type: 'broadcast', event: 'location', payload: loc })
}

export function closeDriverChannel() {
  channel?.unsubscribe()
  channel = null
}
