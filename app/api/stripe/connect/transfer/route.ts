import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-11-17.clover' })

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { driverId, amount, description, deliveryId } = await req.json()

    if (!driverId || !amount) {
      return NextResponse.json({ error: 'Missing driverId or amount' }, { status: 400 })
    }

    const driver = await prisma.user.findUnique({
      where: { id: driverId },
      select: { stripeAccountId: true, name: true }
    })

    if (!driver?.stripeAccountId) {
      return NextResponse.json({ error: 'Driver has no Stripe account connected' }, { status: 400 })
    }

    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      destination: driver.stripeAccountId,
      description: description || `Payment for delivery ${deliveryId}`,
      metadata: { driverId, deliveryId: deliveryId || '' }
    })

    console.log(`💸 Transfer to ${driver.name}: $${amount} — ${transfer.id}`)

    return NextResponse.json({ success: true, transferId: transfer.id })
  } catch (err) {
    console.error('[stripe/connect/transfer]', err)
    return NextResponse.json({ error: 'Transfer failed' }, { status: 500 })
  }
}
