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
    const { type, make, model, year, color, licensePlate, vehiclePhotoUrl, driverLicenseUrl, driverLicenseBackUrl, insuranceUrl } = await req.json()
    const vehicle = await prisma.driverVehicle.upsert({
      where: { driverId: driver.id },
      create: { driverId: driver.id, type, make, model, year, color, licensePlate, vehiclePhotoUrl: vehiclePhotoUrl || null, driverLicenseUrl: driverLicenseUrl || null, driverLicenseBackUrl: driverLicenseBackUrl || null, insuranceUrl: insuranceUrl || null, status: 'PENDING' },
      update: { type, make, model, year, color, licensePlate, vehiclePhotoUrl: vehiclePhotoUrl || null, driverLicenseUrl: driverLicenseUrl || null, driverLicenseBackUrl: driverLicenseBackUrl || null, insuranceUrl: insuranceUrl || null, status: 'PENDING', isVerified: false },
    })
    return NextResponse.json({ success: true, vehicle })
  } catch (err) {
    console.error('[vehicle-mobile]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
