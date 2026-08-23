import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

function generateLockerNumber(countryCode: string): string {
  const code = countryCode.toUpperCase();
  const digits = Math.floor(10000 + Math.random() * 90000).toString();
  return `${code}-${digits}`;
}

export async function GET(req: Request) {
  const prisma = (await import("@/lib/prisma")).default;

  // 🛡️ Seguridad — solo Vercel puede llamar esto
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { getCountryFromPhone } = await import("@/lib/phone-to-country");
    const bcrypt = (await import("bcryptjs")).default;
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    const FORM_ID = process.env.FACEBOOK_FORM_ID;
    const TENANT_ID = '654f5866-247c-4463-b7c7-5e4400c17bc2';

    if (!PAGE_ACCESS_TOKEN || !FORM_ID) {
      return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
    }

    // 1. Obtener todos los leads del formulario de Facebook
    const fbRes = await fetch(
      `https://graph.facebook.com/v19.0/${FORM_ID}/leads?limit=100&access_token=${PAGE_ACCESS_TOKEN}`
    );
    const fbData = await fbRes.json();

    if (fbData.error) {
      console.error('Facebook API error:', fbData.error);
      return NextResponse.json({ error: fbData.error.message }, { status: 400 });
    }

    const leads = fbData.data || [];
    let created = 0;
    let skipped = 0;
    let failed = 0;

    // 2. Procesar cada lead
    for (const lead of leads) {
      try {
        // Extraer campos
        const fields: Record<string, string> = {};
        lead.field_data?.forEach((f: any) => {
          fields[f.name] = f.values?.[0] || '';
        });

        const email = fields['email']?.toLowerCase().trim();
        const name = (fields['full_name'] || `${fields['first_name'] || ''} ${fields['last_name'] || ''}`).trim();
        const phone = fields['phone_number'] || '';

        // Ignorar leads de prueba o sin datos válidos
        if (!email || !name || email === 'test@meta.com' || name.includes('test lead')) {
          skipped++;
          continue;
        }

        // Verificar si ya existe
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          skipped++;
          continue;
        }

        // Detectar país
        const countryCode = fields['country']?.toUpperCase() || getCountryFromPhone(phone);

        // Generar credenciales
        const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        const suiteNo = generateLockerNumber(countryCode);

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
  where: { lead_id: lead.id },
  update: {},
  create: {
    lead_id: lead.id,
    full_name: name,
    email: email,
    phone_number: phone,
    form_id: FORM_ID,
    source: 'facebook',
    status: 'new',
    created_time: lead.created_time ? new Date(lead.created_time) : new Date(),
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
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://www.gaspmakercargo.com/en/recuperar-contrasena"
                   style="background-color: #FBBF24; color: #000; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Set My Password & Login
                </a>
              </div>
              <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
                Enter your email <strong>${email}</strong> to receive your password reset link.
              </p>
            </div>
          `,
        });

        console.log(`✅ Synced: ${email} | Suite: ${suiteNo} | Country: ${countryCode}`);
        created++;

      } catch (err: any) {
        console.error(`❌ Error processing lead:`, err.message);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sync complete. Created: ${created}, Skipped: ${skipped}, Failed: ${failed}`,
      created,
      skipped,
      failed,
    });

  } catch (error: any) {
    console.error('Cron sync-facebook-leads error:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}