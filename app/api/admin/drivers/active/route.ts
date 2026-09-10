import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Drivers con sesión activa en los últimos 10 minutos
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)

    const activeSessions = await prisma.driverSession.findMany({
      where: {
        isOnline: true,
        lastSeen: { gte: tenMinutesAgo }
      },
      include: {
        driver: {
          select: { id: true, name: true, countryCode: true, country: true, image: true }
        }
      },
      orderBy: { lastSeen: 'desc' }
    })

    const drivers = activeSessions.map(s => ({
      id: s.driver.id,
      name: s.driver.name,
      image: s.driver.image,
      countryCode: s.driver.countryCode,
      country: s.driver.country,
      lat: s.lat,
      lng: s.lng,
      lastSeen: s.lastSeen,
    }))

    return NextResponse.json({ drivers })
  } catch (err) {
    console.error('[admin/drivers/active]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
