import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { jwtVerify } from 'jose'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover' as any,
})

async function getDriverId(req: NextRequest): Promise<string | null> {
  try {
    const auth = req.headers.get('authorization')
    if (!auth?.startsWith('Bearer ')) return null
    const token = auth.slice(7)
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    return (payload.id as string) ?? null
  } catch { return null }
}

// POST: crear cuenta Stripe Connect y generar link de onboarding
export async function POST(req: NextRequest) {
  const driverId = await getDriverId(req)
  if (!driverId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { prisma } = await import('@/lib/prisma')
    const user = await prisma.user.findUnique({ where: { id: driverId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    let accountId = user.stripeAccountId

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email ?? undefined,
        capabilities: { transfers: { requested: true } },
      })
      accountId = account.id
      await prisma.user.update({
        where: { id: driverId },
        data: { stripeAccountId: accountId },
      })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.gaspmakercargo.com'
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/driver/payments?connect=refresh`,
      return_url: `${baseUrl}/driver/payments?connect=success`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url, accountId })
  } catch (err: any) {
    console.error('Stripe connect error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET: verificar estado de la cuenta
export async function GET(req: NextRequest) {
  const driverId = await getDriverId(req)
  if (!driverId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { prisma } = await import('@/lib/prisma')
    const user = await prisma.user.findUnique({ where: { id: driverId } })
    const accountId = user?.stripeAccountId

    if (!accountId) return NextResponse.json({ connected: false })

    const account = await stripe.accounts.retrieve(accountId)
    return NextResponse.json({
      connected: true,
      accountId,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}