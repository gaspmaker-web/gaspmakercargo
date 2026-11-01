import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { phone, code, userId } = await req.json()
    if (!phone || !code) return NextResponse.json({ error: 'Phone and code required' }, { status: 400 })

    const normalized = phone.replace(/\D/g, '')
    const e164 = normalized.startsWith('1') ? `+${normalized}` : `+1${normalized}`

    const otp = await prisma.smsOtp.findFirst({
      where: { phone: e164, code, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' }
    })

    if (!otp) return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })

    // Mark as used
    await prisma.smsOtp.update({ where: { id: otp.id }, data: { used: true } })

    // Mark user phone as verified
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: new Date(), phone: e164 }
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[verify-otp]', err)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
