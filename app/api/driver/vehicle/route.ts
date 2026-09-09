import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { type, make, model, year, color, licensePlate, vehiclePhotoUrl, driverLicenseUrl, driverLicenseBackUrl, insuranceUrl } = await req.json()

    const vehicle = await prisma.driverVehicle.upsert({
      where: { driverId: session.user.id },
          create: {
        driverId: session.user.id,
        type, make, model, year, color, licensePlate,
        vehiclePhotoUrl: vehiclePhotoUrl || null,
        driverLicenseUrl: driverLicenseUrl || null,
        driverLicenseBackUrl: driverLicenseBackUrl || null,
        insuranceUrl: insuranceUrl || null,
        status: 'PENDING',
      },
      update: {
        type, make, model, year, color, licensePlate,
        vehiclePhotoUrl: vehiclePhotoUrl || null,
        driverLicenseUrl: driverLicenseUrl || null,
        driverLicenseBackUrl: driverLicenseBackUrl || null,
        insuranceUrl: insuranceUrl || null,
        status: 'PENDING',
        isVerified: false,
      },
    })

    return NextResponse.json({ success: true, vehicle })
  } catch (err) {
    console.error('[driver/vehicle]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
