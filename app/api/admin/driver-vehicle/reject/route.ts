import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { vehicleId, driverId, reason } = await req.json()

    await prisma.driverVehicle.update({
      where: { id: vehicleId },
      data: { status: 'REJECTED', isVerified: false, rejectionReason: reason }
    })

    // Notify driver
    await prisma.notification.create({
      data: {
        userId: driverId,
        title: '❌ Vehicle Registration Rejected',
        message: `Your vehicle registration was rejected. Reason: ${reason}`,
        type: 'ERROR',
        href: '/dashboard-driver/vehicle/register',
      }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/driver-vehicle/reject]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
