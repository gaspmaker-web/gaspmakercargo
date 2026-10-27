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

// GET — todos los vehículos del driver
export async function GET(req: Request) {
  const driver = await getDriverFromToken(req)
  if (!driver) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const vehicles = await prisma.driverVehicle.findMany({
      where: { driverId: driver.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ vehicles })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — registrar nuevo vehículo
export async function POST(req: Request) {
  const driver = await getDriverFromToken(req)
  if (!driver) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { type, make, model, year, color, licensePlate, vehiclePhotoUrl, driverLicenseUrl, driverLicenseBackUrl, insuranceUrl } = await req.json()

    // Si no tiene ningún vehículo, este será el activo
    const existingCount = await prisma.driverVehicle.count({ where: { driverId: driver.id } })

    const vehicle = await prisma.driverVehicle.create({
      data: {
        driverId: driver.id,
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
    console.error('[vehicle-mobile POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — cambiar vehículo activo
export async function PATCH(req: Request) {
  const driver = await getDriverFromToken(req)
  if (!driver) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { vehicleId } = await req.json()

    // Desactivar todos
    await prisma.driverVehicle.updateMany({
      where: { driverId: driver.id },
      data: { isActive: false },
    })

    // Activar el seleccionado
    await prisma.driverVehicle.update({
      where: { id: vehicleId },
      data: { isActive: true },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[vehicle-mobile PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
