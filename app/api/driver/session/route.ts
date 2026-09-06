import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { isOnline, lat, lng, heading, speed, deviceId } = await req.json()

    const driverSession = await prisma.driverSession.upsert({
      where: { driverId: session.user.id },
      create: {
        driverId: session.user.id,
        isOnline,
        lastSeen: new Date(),
        lat,
        lng,
        heading,
        speed,
        deviceId,
      },
      update: {
        isOnline,
        lastSeen: new Date(),
        lat,
        lng,
        heading,
        speed,
        deviceId,
      },
    })

    return NextResponse.json({ success: true, session: driverSession })
  } catch (err) {
    console.error('[driver/session]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const driverSession = await prisma.driverSession.findUnique({
      where: { driverId: session.user.id },
    })

    return NextResponse.json({ session: driverSession })
  } catch (err) {
    console.error('[driver/session]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
