import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return `+${digits}`
}

export async function POST(req: NextRequest) {
  try {
    const { phone, userId } = await req.json()

    if (!phone || !userId) {
      return NextResponse.json({ error: 'phone and userId are required' }, { status: 400 })
    }

    const e164 = toE164(phone)

    // Invalidate previous unused codes for this phone
    await prisma.smsOtp.updateMany({
      where: { phone: e164, used: false },
      data: { used: true },
    })

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.smsOtp.create({
      data: { phone: e164, code, expiresAt, userId },
    })

    await client.messages.create({
      body: `Your Gasp Maker Cargo verification code is: ${code}. Valid for 10 minutes.`,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      to: e164,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('send-otp error:', err)
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
  }
}
