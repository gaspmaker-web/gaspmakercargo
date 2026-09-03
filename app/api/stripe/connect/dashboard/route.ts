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

    // Check if account is fully onboarded
    const account = await stripe.accounts.retrieve(user.stripeAccountId)

    if (!account.details_submitted) {
      // Account not fully onboarded — send back to onboarding
      const accountLink = await stripe.accountLinks.create({
        account: user.stripeAccountId,
        refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/en/dashboard-driver?connect=refresh`,
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/en/dashboard-driver?connect=success`,
        type: 'account_onboarding',
      })
      return NextResponse.json({ url: accountLink.url, needsOnboarding: true })
    }

    const loginLink = await stripe.accounts.createLoginLink(user.stripeAccountId)
    return NextResponse.json({ url: loginLink.url })
  } catch (err) {
    console.error('[stripe/connect/dashboard]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
