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
    // 🔥 NUEVO: ENVIAR EMAIL DE BIENVENIDA AL CLIENTE (MULTILINGÜE)
    // =========================================================================
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.gaspmakercargo.com';
      
      // 1. Determinar el idioma según el país (Inglés como sustituto universal)
      const getLanguage = (code: string) => {
        const upperCode = code.toUpperCase();
        
        // Países hispanohablantes
        const spanishCountries = ['ES', 'MX', 'CO', 'AR', 'PE', 'VE', 'CL', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY', 'PR', 'GQ'];
        if (spanishCountries.includes(upperCode)) return 'es';
        
        // Países francófonos
        const frenchCountries = ['FR', 'HT', 'CD', 'CG', 'ML', 'SN', 'CI', 'CM', 'BE', 'CH', 'MG', 'GN', 'BF', 'BI', 'BJ', 'TG', 'CF', 'GA', 'DJ', 'RW', 'VU', 'SC', 'KM', 'MC'];
        if (frenchCountries.includes(upperCode)) return 'fr';
        
        // Países lusófonos
        const portugueseCountries = ['BR', 'PT', 'AO', 'MZ', 'GW', 'CV', 'ST', 'TL'];
        if (portugueseCountries.includes(upperCode)) return 'pt';
        
        // Si no es ninguno de los anteriores, es INGLÉS por defecto
        return 'en'; 
      };

      const lang = getLanguage(country);

      // 2. Diccionario de traducciones
      const translations = {
        es: {
          subject: '¡Bienvenido a Gasp Maker Cargo! Tu casillero está listo 📦',
          greeting: '¡Hola',
          thanks: 'Gracias por registrarte en',
          body1: 'Tu cuenta ha sido creada exitosamente. Nos emociona tenerte con nosotros y estamos listos para recibir tus compras.',
          suiteLabel: 'Tu Número de Casillero (Suite) es:',
          body2: 'Por favor, asegúrate de incluir este número de Suite junto a tu nombre cada vez que envíes paquetes a nuestras instalaciones para poder identificarlos rápidamente.',
          button: 'Ir a mi panel de cliente',
          footer: 'Si tienes alguna duda o necesitas ayuda, simplemente responde a este correo.<br>¡Gracias por confiar en Gasp Maker Cargo!'
        },
        en: {
          subject: 'Welcome to Gasp Maker Cargo! Your locker is ready 📦',
          greeting: 'Hello',
          thanks: 'Thank you for registering at',
          body1: 'Your account has been successfully created. We are excited to have you with us and are ready to receive your purchases.',
          suiteLabel: 'Your Suite (Locker) Number is:',
          body2: 'Please make sure to include this Suite number next to your name every time you send packages to our facilities so we can identify them quickly.',
          button: 'Go to my client dashboard',
          footer: 'If you have any questions or need help, simply reply to this email.<br>Thank you for trusting Gasp Maker Cargo!'
        },
        fr: {
          subject: 'Bienvenue chez Gasp Maker Cargo ! Votre casier est prêt 📦',
          greeting: 'Bonjour',
          thanks: 'Merci de vous être inscrit chez',
          body1: 'Votre compte a été créé avec succès. Nous sommes ravis de vous compter parmi nous et sommes prêts à recevoir vos achats.',
          suiteLabel: 'Votre numéro de casier (Suite) est :',
          body2: 'Veuillez vous assurer d\'inclure ce numéro de Suite à côté de votre nom chaque fois que vous envoyez des colis à nos installations afin que nous puissions les identifier rapidement.',
          button: 'Aller à mon tableau de bord client',
          footer: 'Si vous avez des questions ou avez besoin d\'aide, répondez simplement à cet e-mail.<br>Merci de faire confiance à Gasp Maker Cargo !'
        },
        pt: {
          subject: 'Bem-vindo à Gasp Maker Cargo! Seu armário está pronto 📦',
          greeting: 'Olá',
          thanks: 'Obrigado por se registrar na',
          body1: 'Sua conta foi criada com sucesso. Estamos animados em ter você conosco e prontos para receber suas compras.',
          suiteLabel: 'O número do seu armário (Suite) é:',
          body2: 'Por favor, certifique-se de incluir este número de Suite ao lado do seu nome toda vez que enviar pacotes para nossas instalações para que possamos identificá-los rapidamente.',
          button: 'Ir para o painel do cliente',
          footer: 'Se você tiver alguma dúvida ou precisar de ajuda, basta responder a este e-mail.<br>Obrigado por confiar na Gasp Maker Cargo!'
        }
      };

      const t = translations[lang as keyof typeof translations];

      await resend.emails.send({
        from: 'Gasp Maker Cargo <info@gaspmakercargo.com>',
        to: email,
        subject: t.subject,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="text-align: center; padding-bottom: 20px;">
              <h1 style="color: #FBBF24; margin-bottom: 5px;">${t.greeting}, ${name}!</h1>
              <p style="font-size: 16px;">${t.thanks} <strong>Gasp Maker Cargo</strong>.</p>
            </div>
            
            <p>${t.body1}</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <p style="margin: 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px;">${t.suiteLabel}</p>
              <p style="margin: 10px 0 0 0; font-size: 28px; font-weight: bold; color: #111;">${suiteNo}</p>
            </div>

            <p>${t.body2}</p>
            
            <div style="text-align: center; margin-top: 40px;">
              <a href="${baseUrl}/${lang}/login-cliente" style="background-color: #FBBF24; color: #000; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                ${t.button}
              </a>
            </div>
            
            <p style="margin-top: 40px; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
              ${t.footer}
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










