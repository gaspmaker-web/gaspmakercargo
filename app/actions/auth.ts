"use server";

import prisma from "@/lib/prisma"; 
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { nanoid } from "nanoid";

// 🚀 TU SISTEMA ACTUAL: Importamos tu propia función generadora de casilleros
import { generateLockerNumber } from "@/lib/utils";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function registrarUsuario(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const countryCode = formData.get("countryCode") as string;
  const phone = formData.get("phone") as string;
  const dateOfBirth = formData.get("dateOfBirth") as string;
  const referredBy = formData.get("referredBy") as string;
  const turnstileToken = formData.get("turnstileToken") as string;
  const honeypot = formData.get("address-field") as string;

  // 1. Verificación Honeypot (Trampa para bots)
  if (honeypot) {
    console.warn("Bot detectado en el Honeypot.");
    return { success: true, message: "Proceso completado. Revisa tu bandeja de entrada." };
  }

  // 2. Validación de Cloudflare Turnstile
  const verifyEndpoint = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
  const verifyResponse = await fetch(verifyEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `secret=${process.env.CLOUDFLARE_TURNSTILE_SECRET}&response=${turnstileToken}`,
  });

  const verifyData = await verifyResponse.json();

  if (!verifyData.success) {
    return { error: "La verificación de seguridad ha fallado. Inténtalo nuevamente." };
  }

  try {
    // 3. Verificar duplicados en la base de datos de desarrollo
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "Este correo electrónico ya se encuentra registrado." };
    }

    // 4. Cifrado de contraseña y preparación de tokens
    const hashedPassword = await bcrypt.hash(password, 10);
    const token = nanoid(32);
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 horas

    // 🚀 TU SISTEMA ACTUAL: Determinamos país y generamos la Suite real con tu función
    const country = countryCode || 'US';
    const suiteNo = generateLockerNumber(country);

    const finalDate = dateOfBirth ? new Date(dateOfBirth) : null;

    // Registro del usuario en la base de datos dentro de una transacción limpia
    await prisma.$transaction([
      prisma.user.create({
        data: {
          email,
          name, // ✅ Guardamos el nombre y apellido completos
          password: hashedPassword,
          suiteNo, // ✅ Guardamos el número de casillero real generado por tu sistema
          role: "CLIENTE",
          countryCode: country,
          phone,
          dateOfBirth: finalDate,
          referredBy: referredBy || null,
          emailVerified: null, // 🔒 Estrictamente null: la cuenta NO está activa todavía
        },
      }),
      prisma.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires: expirationDate,
        },
      }),
    ]);

    // 5. Envío del enlace de confirmación y bienvenida (Resend)
    const confirmLink = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify-email?token=${token}`;

    await resend.emails.send({
      from: "Gasp Maker Cargo <no-reply@gaspmakercargo.com>",
      to: email,
      subject: "Activa tu cuenta y tu casillero en Gasp Maker Cargo 📦",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; color: #333;">
          <h2 style="color: #111; text-align: center;">¡Hola, ${name}!</h2>
          <p>Gracias por registrarte. Tu cuenta y tu número de casillero han sido reservados de manera exitosa en nuestro sistema.</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Tu Número de Casillero (Suite) asignado:</p>
            <p style="margin: 10px 0 0 0; font-size: 26px; font-weight: bold; color: #111;">${suiteNo}</p>
          </div>

          <p>Para completar la activación de tu cuenta, poder ingresar a tu panel de usuario y comenzar a recibir paquetes en nuestras instalaciones, por favor confirma tu correo electrónico haciendo clic en el siguiente botón:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmLink}" style="background-color: #FBBF24; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Activar mi Cuenta y Casillero</a>
          </div>
          
          <p style="font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 15px;">
            Este enlace es válido por 24 horas. Si tú no realizaste esta solicitud, puedes ignorar este mensaje de forma segura.
          </p>
        </div>
      `,
    });

    return { success: true, message: "Registro pre-completado con éxito. Por favor, revisa tu correo electrónico para verificar tu cuenta y activar tu casillero." };

  } catch (error) {
    console.error("Error en el proceso de desarrollo de registro:", error);
    return { error: "Ocurrió un error inesperado al procesar la solicitud." };
  }
}