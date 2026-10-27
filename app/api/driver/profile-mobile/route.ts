import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import prisma from '@/lib/prisma'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)

async function getDriverFromToken(req: Request) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  try {
    const { payload } = await jwtVerify(auth.slice(7), secret)
    return payload as { id: string; email: string; role: string }
  } catch { return null }
}

// GET — perfil completo del driver
export async function GET(req: Request) {
  try {
    const payload = await getDriverFromToken(req)
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        address: true,
        createdAt: true,
        driverVehicles: { where: { isActive: true }, take: 1 },
        driverSession: { select: { isOnline: true } },
      }
    })

    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const v = user.driverVehicles[0]

    return NextResponse.json({
      driver: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        image: user.image,
        address: user.address,
        zone: 'US',
        memberSince: user.createdAt,
        isOnline: user.driverSession?.isOnline ?? false,
      },
      vehicle: v ? {
        make: v.make,
        model: v.model,
        year: v.year,
        color: v.color,
        licensePlate: v.licensePlate,
        type: v.type,
        status: v.status,
        vehiclePhoto: v.vehiclePhotoUrl,
        licenceFront: v.driverLicenseUrl,
        licenceBack: v.driverLicenseBackUrl,
        insuranceCard: v.insuranceUrl,
      } : null
    })
  } catch (err) {
    console.error('[profile-mobile GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — actualizar foto o dirección
export async function PATCH(req: Request) {
  try {
    const payload = await getDriverFromToken(req)
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { image, address } = body

    const data: any = {}
    if (image !== undefined) data.image = image
    if (address !== undefined) data.address = address

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: payload.id },
      data,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[profile-mobile PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}