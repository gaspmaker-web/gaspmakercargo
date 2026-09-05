import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const drivers = await prisma.user.findMany({
      where: { role: 'DRIVER' },
      select: { id: true, name: true, countryCode: true, country: true }
    })

    return NextResponse.json({ drivers })
  } catch (err) {
    console.error('[admin/drivers/active]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
