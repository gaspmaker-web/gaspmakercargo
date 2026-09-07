import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { vehicleId, driverId } = await req.json()

    await prisma.driverVehicle.update({
      where: { id: vehicleId },
      data: { status: 'APPROVED', isVerified: true, verifiedAt: new Date() }
    })

    // Notify driver
    await prisma.notification.create({
      data: {
        userId: driverId,
        title: '✅ Vehicle Approved',
        message: 'Your vehicle has been approved. You can now go online and receive deliveries!',
        type: 'SUCCESS',
        href: '/dashboard-driver',
      }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/driver-vehicle/approve]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
