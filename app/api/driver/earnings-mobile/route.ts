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

export async function GET(req: Request) {
  const driver = await getDriverFromToken(req)
  if (!driver) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const completedDeliveries = await prisma.pickupRequest.findMany({
      where: { driverId: driver.id, status: 'ENTREGADO' },
      select: { id: true, totalPaid: true, updatedAt: true, originAddress: true, dropOffAddress: true },
      orderBy: { updatedAt: 'desc' },
      take: 50
    })
    const totalEarned = completedDeliveries.reduce((sum, d) => sum + (d.totalPaid || 0) * 0.7, 0)
    return NextResponse.json({
      totalEarned,
      deliveries: completedDeliveries.map(d => ({
        id: d.id,
        originAddress: d.originAddress,
        dropOffAddress: d.dropOffAddress,
        updatedAt: d.updatedAt,
        earned: (d.totalPaid || 0) * 0.7
      }))
    })
  } catch (err) {
    console.error('[driver/earnings-mobile]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
