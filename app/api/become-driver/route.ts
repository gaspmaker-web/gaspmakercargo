import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { name, email, phone, zone, vehicleType, hasInsurance, message } = await req.json()

    await resend.emails.send({
      from: 'noreply@gaspmakercargo.com',
      to: 'support@gaspmakercargo.com',
      subject: `New Driver Application — ${name}`,
      html: `
        <h2>New Driver Application</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Zone:</strong> ${zone}</p>
        <p><strong>Vehicle Type:</strong> ${vehicleType}</p>
        <p><strong>Has Insurance:</strong> ${hasInsurance}</p>
        <p><strong>Message:</strong> ${message || 'N/A'}</p>
      `
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[become-driver]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
