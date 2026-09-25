import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

   const { billIds, amount, selectedCourier, courierService } = await req.json()

// Update consolidations to PENDIENTE_ZELLE
await prisma.consolidatedShipment.updateMany({
  where: { id: { in: billIds } },
  data: { 
    status: 'PENDIENTE_ZELLE',
    totalAmount: parseFloat(amount) || 0,
    selectedCourier: selectedCourier || null,
    courierService: courierService || null
}
})

    // Notify admin
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true }
    })

    await Promise.all(adminUsers.map(admin =>
      prisma.notification.create({
        data: {
          userId: admin.id,
          title: '💜 Zelle Payment Pending',
          message: `${session.user.name} sent $${amount.toFixed(2)} via Zelle. Please verify and confirm.`,
          type: 'INFO',
          href: '/dashboard-admin/consolidaciones',
        }
      })
    ))

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[payments/zelle-pending]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
