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
    const user = await prisma.user.findUnique({
      where: { id: driver.id },
      select: { name: true, email: true, phone: true, countryCode: true, image: true, createdAt: true }
    })
    const vehicle = await prisma.driverVehicle.findUnique({
      where: { driverId: driver.id },
      select: {
        make: true, model: true, year: true, color: true, licensePlate: true, status: true,
        vehiclePhotoUrl: true, driverLicenseUrl: true, driverLicenseBackUrl: true, insuranceUrl: true
      }
    })
    return NextResponse.json({
      driver: { name: user?.name, email: user?.email, phone: user?.phone, zone: user?.countryCode, image: user?.image, memberSince: user?.createdAt },
      vehicle: vehicle ? {
        make: vehicle.make, model: vehicle.model, year: vehicle.year, color: vehicle.color,
        licensePlate: vehicle.licensePlate, status: vehicle.status,
        licenceFront: vehicle.driverLicenseUrl, licenceBack: vehicle.driverLicenseBackUrl,
        vehiclePhoto: vehicle.vehiclePhotoUrl, insuranceCard: vehicle.insuranceUrl,
      } : null
    })
  } catch (err) {
    console.error('[profile-mobile]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
