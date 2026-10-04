import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { amount } = await req.json()

    const b2b = await prisma.b2BAccount.findUnique({
      where: { userId: session.user.id }
    })

    if (!b2b) return NextResponse.json({ error: 'B2B account not found' }, { status: 404 })

    const creditAvailable = b2b.creditLimit - b2b.creditUsed
    if (amount > creditAvailable) {
      return NextResponse.json({ error: 'Credit limit exceeded' }, { status: 400 })
    }

    await prisma.b2BAccount.update({
      where: { userId: session.user.id },
      data: { creditUsed: b2b.creditUsed + amount, updatedAt: new Date() }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[b2b/charge-account]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
