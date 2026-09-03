import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-11-17.clover' })

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeAccountId: true, email: true, name: true }
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    let accountId = user.stripeAccountId

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email!,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: { userId: session.user.id }
      })

      accountId = account.id

      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeAccountId: accountId }
      })
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/en/dashboard-driver?connect=refresh`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/en/dashboard-driver?connect=success`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (err) {
    console.error('[stripe/connect/onboard]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
