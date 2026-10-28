import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { jwtVerify } from 'jose'

async function getDriverFromToken(req: Request) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'secret')
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as any
  } catch { return null }
}

export async function POST(req: Request) {
  const driver = await getDriverFromToken(req)
  if (!driver) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
   const { isOnline, lat, lng, heading, speed, deviceId, pushToken } = await req.json()
const driverSession = await prisma.driverSession.upsert({
  where: { driverId: driver.id },
  create: { driverId: driver.id, isOnline, lastSeen: new Date(), lat, lng, heading, speed, deviceId, pushToken },
  update: { isOnline, lastSeen: new Date(), lat, lng, heading, speed, deviceId, ...(pushToken && { pushToken }) },
})
    return NextResponse.json({ success: true, session: driverSession })
  } catch (err) {
    console.error('[session-mobile]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const driver = await getDriverFromToken(req)
  if (!driver) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const driverSession = await prisma.driverSession.findUnique({ where: { driverId: driver.id } })
    return NextResponse.json({ session: driverSession })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
