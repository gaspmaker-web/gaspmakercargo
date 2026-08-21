import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 🔥 VERIFICACIÓN DEL WEBHOOK (Facebook requiere esto al configurar)
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
    const { generateLockerNumber } = await import('@/lib/utils');
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const body = await req.json();

    // Extraer los leads del payload de Facebook
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const leadData = changes?.value;

    if (!leadData || leadData.item !== 'lead') {
      return NextResponse.json({ status: 'ignored' });
    }

    // 🔥 Obtener datos del formulario desde Facebook Graph API
    const leadId = leadData.leadgen_id;
    const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    const fbRes = await fetch(
      `https://graph.facebook.com/v19.0/${leadId}?access_token=${accessToken}`
    );
    const fbData = await fbRes.json();

    // Extraer campos del formulario
    const fields: Record<string, string> = {};
    fbData.field_data?.forEach((f: any) => {
      fields[f.name] = f.values?.[0] || '';
    });

    const email = fields['email']?.toLowerCase().trim();
    const name = fields['full_name'] || fields['first_name'] + ' ' + (fields['last_name'] || '');
    const phone = fields['phone_number'] || '';
    const countryCode = fields['country'] || 'TT'; // Default Trinidad

    if (!email || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verificar si ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ status: 'already_exists' });
    }

    // Generar contraseña temporal
    const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const suiteNo = generateLockerNumber(countryCode);

    const TENANT_IDS: Record<string, string> = {
      'gaspmaker': '654f5866-247c-4463-b7c7-5e4400c17bc2',
    };
    const tenantId = TENANT_IDS['gaspmaker'];

    // Crear usuario
    await prisma.user.create({
      data: {
        email,
        name: name.trim(),
        password: hashedPassword,
        suiteNo,
        role: 'CLIENTE',
        tenant_id: tenantId,
        countryCode,
        phone,
        referredBy: null
      }
    });

    // Enviar email con contraseña temporal
    await resend.emails.send({
      from: 'Gasp Maker Cargo <info@gaspmakercargo.com>',
      to: email,
      subject: 'Welcome to Gasp Maker Cargo! Your account is ready 📦',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h1 style="color: #FBBF24;">Hello, ${name.trim()}!</h1>
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
        </div>
      `
    });

    console.log(`✅ Facebook Lead registered: ${email} | Suite: ${suiteNo}`);
    return NextResponse.json({ status: 'success', email, suiteNo });

  } catch (error: any) {
    console.error('Facebook webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}