import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-11-17.clover' })

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeAccountId: true }
    })

    if (!user?.stripeAccountId) {
      return NextResponse.json({ error: 'No Stripe account connected' }, { status: 400 })
    }

    const loginLink = await stripe.accounts.createLoginLink(user.stripeAccountId)

    return NextResponse.json({ url: loginLink.url })
  } catch (err) {
    console.error('[stripe/connect/dashboard]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
