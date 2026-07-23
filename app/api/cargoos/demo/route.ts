import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { name, company, country, volume, email } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'Nombre y email requeridos' }, { status: 400 });
    }

    await resend.emails.send({
    from: 'CargoOS <no-reply@gaspmakercargo.com>',
      to: 'hello@cargoos.io',
      subject: `🚢 Nueva solicitud de demo — ${company || name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #000; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">🚢 Nueva solicitud de demo</h1>
          </div>
          <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e5e5;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Nombre</td><td style="padding: 8px 0; font-weight: 600;">${name}</td></tr>
              <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Empresa</td><td style="padding: 8px 0; font-weight: 600;">${company || '—'}</td></tr>
              <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">País</td><td style="padding: 8px 0; font-weight: 600;">${country || '—'}</td></tr>
              <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Volumen estimado</td><td style="padding: 8px 0; font-weight: 600;">${volume || '—'}</td></tr>
              <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Email</td><td style="padding: 8px 0; font-weight: 600;"><a href="mailto:${email}">${email}</a></td></tr>
            </table>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error sending demo email:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}