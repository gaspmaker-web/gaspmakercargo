import { NextResponse } from "next/server";

// 👇 VACUNA 1: Forzar modo dinámico
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 👇 VACUNA 2: Imports dentro de la función (Lazy Loading)
    // Esto evita que Vercel ejecute esto durante el Build
    const prisma = (await import("@/lib/prisma")).default;
    const bcrypt = (await import("bcryptjs")).default;
    const { generateLockerNumber } = await import("@/lib/utils");
    
    // 🔥 NUEVO: Importamos Resend para el correo de bienvenida
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const body = await req.json();
    // Ya no esperamos day/month/year por separado, sino dateOfBirth directo
    const { email, password, name, countryCode, phone, dateOfBirth } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ message: "Faltan datos obligatorios" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: "El correo ya está registrado" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const country = countryCode || 'US';
    const suiteNo = generateLockerNumber(country);

    // Convertimos el string ISO a objeto Date de JS
    const finalDate = dateOfBirth ? new Date(dateOfBirth) : null;

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        // 🔥 CORRECCIÓN CRÍTICA: Ahora guardamos en 'password', no en 'password_hash'
        password: hashedPassword,
        suiteNo,
        role: "CLIENTE",
        countryCode: country,
        phone,
        dateOfBirth: finalDate
      },
    });

    // =========================================================================
    // 🔥 NUEVO: ENVIAR EMAIL DE BIENVENIDA AL CLIENTE
    // =========================================================================
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.gaspmakercargo.com';
      
      await resend.emails.send({
        from: 'Gasp Maker Cargo <info@gaspmakercargo.com>',
        to: email,
        subject: '¡Bienvenido a Gasp Maker Cargo! Tu casillero está listo 📦',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="text-align: center; padding-bottom: 20px;">
              <h1 style="color: #FBBF24; margin-bottom: 5px;">¡Hola, ${name}!</h1>
              <p style="font-size: 16px;">Gracias por registrarte en <strong>Gasp Maker Cargo</strong>.</p>
            </div>
            
            <p>Tu cuenta ha sido creada exitosamente. Nos emociona tenerte con nosotros y estamos listos para recibir tus compras.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <p style="margin: 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Tu Número de Casillero (Suite) es:</p>
              <p style="margin: 10px 0 0 0; font-size: 28px; font-weight: bold; color: #111;">${suiteNo}</p>
            </div>

            <p>Por favor, asegúrate de incluir este número de Suite junto a tu nombre cada vez que envíes paquetes a nuestras instalaciones para poder identificarlos rápidamente.</p>
            
            <div style="text-align: center; margin-top: 40px;">
              <a href="${baseUrl}/es/login-cliente" style="background-color: #FBBF24; color: #000; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Ir a mi panel de cliente
              </a>
            </div>
            
            <p style="margin-top: 40px; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
              Si tienes alguna duda o necesitas ayuda, simplemente responde a este correo.<br>
              ¡Gracias por confiar en Gasp Maker Cargo!
            </p>
          </div>
        `
      });
    } catch (emailError) {
      console.error("Error silencioso al enviar correo de bienvenida:", emailError);
      // El bloque catch asegura que si Resend falla, el cliente igual se registra con éxito.
    }
    // =========================================================================

    return NextResponse.json(
      { message: "Usuario creado con éxito", user: newUser },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Error en registro:", error);
    return NextResponse.json(
      { message: "Ocurrió un error en el servidor", error: error.message },
      { status: 500 }
    );
  }
}










