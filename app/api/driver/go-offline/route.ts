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
    // 1. Marcar driver como offline
    await prisma.driverSession.upsert({
      where: { driverId: driver.id },
      update: { isOnline: false, lastSeen: new Date() },
      create: { driverId: driver.id, isOnline: false },
    })

    // 2. Liberar todas las tareas activas del driver
    await prisma.pickupRequest.updateMany({
      where: {
        driverId: driver.id,
        status: { in: ['IN_PROGRESS', 'ASSIGNED', 'ACCEPTED'] },
      },
      data: {
        driverId: null,
        status: 'PENDIENTE',
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[go-offline]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}