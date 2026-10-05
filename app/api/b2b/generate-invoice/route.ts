import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const b2b = await prisma.b2BAccount.findUnique({
      where: { userId: session.user.id },
      include: { user: { select: { name: true, email: true } } }
    })

    if (!b2b) return NextResponse.json({ error: 'B2B account not found' }, { status: 404 })

    // Get deliveries for this billing cycle
    const cycleStart = new Date()
    cycleStart.setDate(cycleStart.getDate() - b2b.billingCycle)

    const deliveries = await prisma.pickupRequest.findMany({
      where: {
        userId: session.user.id,
        createdAt: { gte: cycleStart },
        status: { in: ['PAGADO', 'ENTREGADO', 'ACEPTADO', 'EN_REPARTO'] }
      },
      orderBy: { createdAt: 'desc' }
    })

    const invoiceData = {
      businessName: b2b.businessName,
      businessAddress: b2b.businessAddress,
      contactName: b2b.contactName,
      email: b2b.user.email,
      billingCycle: b2b.billingCycle,
      creditUsed: b2b.creditUsed,
      creditLimit: b2b.creditLimit,
      deliveries,
      generatedAt: new Date().toISOString(),
      invoiceNumber: `GMC-B2B-${Date.now()}`
    }

    return NextResponse.json({ success: true, invoice: invoiceData })
  } catch (err) {
    console.error('[b2b/generate-invoice]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
