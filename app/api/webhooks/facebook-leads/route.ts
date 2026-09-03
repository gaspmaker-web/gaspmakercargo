import { NextResponse } from 'next/server';
import { getCountryFromPhone } from '@/lib/phone-to-country';

export const dynamic = 'force-dynamic';

function generateLockerNumber(countryCode: string): string {
  const code = countryCode.toUpperCase();
  const digits = Math.floor(10000 + Math.random() * 90000).toString();
  return `${code}-${digits}`;
}

// 🔥 VERIFICACIÓN DEL WEBHOOK
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// 🔥 RECIBIR LEADS
export async function POST(req: Request) {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const bcrypt = (await import('bcryptjs')).default;
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const body = await req.json();

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const leadData = changes?.value;

    if (!leadData || leadData.item !== 'lead') {
      return NextResponse.json({ status: 'ignored' });
    }

    const leadId = leadData.leadgen_id;
    const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    const fbRes = await fetch(
      `https://graph.facebook.com/v19.0/${leadId}?access_token=${accessToken}`
    );
    const fbData = await fbRes.json();

    if (fbData.error) {
      console.error('Facebook API error:', fbData.error);
      return NextResponse.json({ error: fbData.error.message }, { status: 400 });
    }

    // Extraer campos del formulario
    const fields: Record<string, string> = {};
    fbData.field_data?.forEach((f: any) => {
      fields[f.name] = f.values?.[0] || '';
    });

    const email = fields['email']?.toLowerCase().trim();
    const name = (fields['full_name'] || `${fields['first_name'] || ''} ${fields['last_name'] || ''}`).trim();
    const phone = fields['phone_number'] || '';

    if (!email || !name) {
      console.error('Missing required fields:', { email, name });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 🌍 Detectar país automáticamente por teléfono
    const countryCode = fields['country']?.toUpperCase() || getCountryFromPhone(phone);

    // Verificar si ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.log(`⏭️ Already exists: ${email}`);
      return NextResponse.json({ status: 'already_exists' });
    }

    // Generar credenciales
    const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const suiteNo = generateLockerNumber(countryCode);

    const TENANT_ID = '654f5866-247c-4463-b7c7-5e4400c17bc2';

    // Crear usuario
    await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        suiteNo,
        role: 'CLIENTE',
        tenant_id: TENANT_ID,
        countryCode,
        phone,
        referredBy: null,
      },
    });

    // Guardar en tabla Lead
await (prisma as any).lead.upsert({
  where: { lead_id: leadId },
  update: {},
  create: {
    lead_id: leadId,
    full_name: name,
    email: email,
    phone_number: phone,
    form_id: leadData.form_id || '',
    source: 'facebook',
    status: 'new',
    created_time: new Date(),
  },
}); 

    // Enviar email de bienvenida
    await resend.emails.send({
      from: 'Gasp Maker Cargo <info@gaspmakercargo.com>',
      to: email,
      subject: 'Welcome to Gasp Maker Cargo! Your account is ready 📦',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h1 style="color: #FBBF24;">Hello, ${name}!</h1>
          <p>Your Gasp Maker Cargo account has been created automatically.</p>

          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
            <p style="margin: 0; font-size: 14px; color: #666;">Your Suite Number:</p>
            <p style="font-size: 28px; font-weight: bold; color: #111;">${suiteNo}</p>
          </div>

          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #666;">Your temporary password:</p>
            <p style="font-size: 24px; font-weight: bold; color: #111; font-family: monospace;">${tempPassword}</p>
            <p style="font-size: 12px; color: #666; margin-top: 8px;">Please change your password after logging in.</p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://www.gaspmakercargo.com/en/login-cliente"
               style="background-color: #FBBF24; color: #000; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Login to My Account
            </a>
          </div>

          <div style="text-align: center; margin-top: 20px; padding: 15px; background-color: #fef9c3; border-radius: 8px; border: 1px solid #fde68a;">
    <p style="margin: 0 0 8px 0; font-size: 13px; color: #92400e;">📧 Can't find our email? Check your <strong>spam/junk folder</strong> or set your password here:</p>
    <a href="https://www.gaspmakercargo.com/en/recuperar-contrasena"
       style="display: inline-block; background-color: #374151; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px;">
        🔗 Set My Password
    </a>
</div>

          <div style="text-align: center; margin-top: 20px; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Follow us for tips, deals & updates:</p>
            <a href="https://www.instagram.com/gaspmakercargo" target="_blank"
               style="display: inline-block; background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
                📸 Follow @gaspmakercargo
            </a>
          </div>
        </div>
      `,
    });
    console.log(`✅ Lead registered: ${email} | Suite: ${suiteNo} | Country: ${countryCode}`);
    return NextResponse.json({ status: 'success', email, suiteNo, countryCode });

  } catch (error: any) {
    console.error('Facebook webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}