import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { type, make, model, year, color, licensePlate, vehiclePhotoUrl, driverLicenseUrl, driverLicenseBackUrl, insuranceUrl } = await req.json()

    const existingCount = await prisma.driverVehicle.count({
      where: { driverId: session.user.id }
    })

    const vehicle = await prisma.driverVehicle.create({
      data: {
        driverId: session.user.id,
        type, make, model, year, color, licensePlate,
        vehiclePhotoUrl: vehiclePhotoUrl || null,
        driverLicenseUrl: driverLicenseUrl || null,
        driverLicenseBackUrl: driverLicenseBackUrl || null,
        insuranceUrl: insuranceUrl || null,
        status: 'PENDING',
        isActive: existingCount === 0,
      },
    })

    return NextResponse.json({ success: true, vehicle })
  } catch (err) {
    console.error('[driver/vehicle]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
