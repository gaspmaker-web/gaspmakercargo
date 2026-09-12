import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { applicationId, status, applicantEmail, applicantName } = await req.json()

    await prisma.driverApplication.update({
      where: { id: applicationId },
      data: { status }
    })

    if (status === 'APPROVED') {
      await resend.emails.send({
        from: 'noreply@gaspmakercargo.com',
        to: applicantEmail,
        subject: '✅ Driver Application Approved — Gasp Maker',
        html: `
          <h2>Congratulations, ${applicantName}!</h2>
          <p>Your driver application has been approved. Our team will contact you shortly with your login credentials.</p>
          <p>Once you receive your credentials, download the Gasp Maker app and log in to start driving.</p>
          <br/>
          <p>Best regards,<br/>Gasp Maker LLC</p>
        `
      })
    } else {
      await resend.emails.send({
        from: 'noreply@gaspmakercargo.com',
        to: applicantEmail,
        subject: 'Driver Application Update — Gasp Maker',
        html: `
          <h2>Hello, ${applicantName}</h2>
          <p>Thank you for your interest in driving with Gasp Maker. After reviewing your application, we are unable to move forward at this time.</p>
          <p>You are welcome to apply again in the future.</p>
          <br/>
          <p>Best regards,<br/>Gasp Maker LLC</p>
        `
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[driver-applications/update]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
