import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import prisma from '@/lib/prisma'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { name, email, phone, zone, vehicleType, hasInsurance, message } = await req.json()

    // Save to DB
    const application = await prisma.driverApplication.create({
      data: { name, email, phone, zone, vehicleType, hasInsurance, message }
    })

    // Email to admin
    await resend.emails.send({
      from: 'noreply@gaspmakercargo.com',
      to: 'support@gaspmakercargo.com',
      subject: `🚗 New Driver Application — ${name}`,
      html: `
        <h2>New Driver Application</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Zone:</strong> ${zone}</p>
        <p><strong>Vehicle Type:</strong> ${vehicleType}</p>
        <p><strong>Has Insurance:</strong> ${hasInsurance || 'Not specified'}</p>
        <p><strong>Message:</strong> ${message || 'N/A'}</p>
        <br/>
        <a href="https://www.gaspmakercargo.com/en/dashboard-admin/driver-applications" style="background:#222b3c;color:#F4DBA7;padding:10px 20px;text-decoration:none;border-radius:8px;font-weight:bold;">
          Review Application
        </a>
      `
    })

    // Confirmation email to applicant
    await resend.emails.send({
      from: 'noreply@gaspmakercargo.com',
      to: email,
      subject: 'Application Received — Gasp Maker',
      html: `
        <h2>Thank you, ${name}!</h2>
        <p>We received your driver application. Our team will review it and contact you within 24-48 hours.</p>
        <p>If you have any questions, contact us at <a href="mailto:support@gaspmakercargo.com">support@gaspmakercargo.com</a></p>
        <br/>
        <p>Best regards,<br/>Gasp Maker LLC</p>
      `
    })

    return NextResponse.json({ success: true, id: application.id })
  } catch (err) {
    console.error('[become-driver]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
