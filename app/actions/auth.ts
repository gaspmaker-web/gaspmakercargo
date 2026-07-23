"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { nanoid } from "nanoid";
import { generateLockerNumber } from "@/lib/utils";

const resend = new Resend(process.env.RESEND_API_KEY);

// 🌐 TEXTOS MULTILINGUES
const i18n = {
  es: {
    successMessage: "Registro pre-completado con éxito. Por favor, revisa tu correo electrónico para verificar tu cuenta y activar tu casillero.",
    emailSubject: "Activa tu cuenta y tu casillero en Gasp Maker Cargo 📦",
    emailGreeting: (name: string) => `¡Hola, ${name}!`,
    emailIntro: "Gracias por registrarte. Tu cuenta y tu número de casillero han sido reservados de manera exitosa en nuestro sistema.",
    emailSuiteLabel: "Tu Número de Casillero (Suite) asignado:",
    emailCta: "Para completar la activación de tu cuenta, poder ingresar a tu panel de usuario y comenzar a recibir paquetes en nuestras instalaciones, por favor confirma tu correo electrónico haciendo clic en el siguiente botón:",
    emailBtn: "Activar mi Cuenta y Casillero",
    emailFooter: "Este enlace es válido por 24 horas. Si tú no realizaste esta solicitud, puedes ignorar este mensaje de forma segura.",
    errorDuplicate: "Este correo electrónico ya se encuentra registrado.",
    errorCaptcha: "La verificación de seguridad ha fallado. Inténtalo nuevamente.",
    errorGeneric: "Ocurrió un error inesperado al procesar la solicitud.",
  },
  en: {
    successMessage: "Registration pre-completed successfully. Please check your email to verify your account and activate your locker.",
    emailSubject: "Activate your account and locker at Gasp Maker Cargo 📦",
    emailGreeting: (name: string) => `Hello, ${name}!`,
    emailIntro: "Thank you for registering. Your account and locker number have been successfully reserved in our system.",
    emailSuiteLabel: "Your assigned Locker Number (Suite):",
    emailCta: "To complete your account activation and start receiving packages at our facility, please confirm your email by clicking the button below:",
    emailBtn: "Activate my Account and Locker",
    emailFooter: "This link is valid for 24 hours. If you did not make this request, you can safely ignore this message.",
    errorDuplicate: "This email address is already registered.",
    errorCaptcha: "Security verification failed. Please try again.",
    errorGeneric: "An unexpected error occurred while processing your request.",
  },
  pt: {
    successMessage: "Registro pré-completado com sucesso. Por favor, verifique seu e-mail para confirmar sua conta e ativar seu armário.",
    emailSubject: "Ative sua conta e armário na Gasp Maker Cargo 📦",
    emailGreeting: (name: string) => `Olá, ${name}!`,
    emailIntro: "Obrigado por se registrar. Sua conta e número de armário foram reservados com sucesso em nosso sistema.",
    emailSuiteLabel: "Seu Número de Armário (Suite) atribuído:",
    emailCta: "Para concluir a ativação da sua conta e começar a receber pacotes em nossas instalações, confirme seu e-mail clicando no botão abaixo:",
    emailBtn: "Ativar minha Conta e Armário",
    emailFooter: "Este link é válido por 24 horas. Se você não fez esta solicitação, pode ignorar esta mensagem com segurança.",
    errorDuplicate: "Este endereço de e-mail já está registrado.",
    errorCaptcha: "A verificação de segurança falhou. Tente novamente.",
    errorGeneric: "Ocorreu um erro inesperado ao processar sua solicitação.",
  },
  fr: {
    successMessage: "Inscription pré-complétée avec succès. Veuillez vérifier votre e-mail pour confirmer votre compte et activer votre casier.",
    emailSubject: "Activez votre compte et votre casier chez Gasp Maker Cargo 📦",
    emailGreeting: (name: string) => `Bonjour, ${name} !`,
    emailIntro: "Merci de vous être inscrit. Votre compte et votre numéro de casier ont été réservés avec succès dans notre système.",
    emailSuiteLabel: "Votre numéro de casier (Suite) attribué :",
    emailCta: "Pour finaliser l'activation de votre compte et commencer à recevoir des colis dans nos locaux, veuillez confirmer votre e-mail en cliquant sur le bouton ci-dessous :",
    emailBtn: "Activer mon Compte et mon Casier",
    emailFooter: "Ce lien est valable 24 heures. Si vous n'avez pas fait cette demande, vous pouvez ignorer ce message en toute sécurité.",
    errorDuplicate: "Cette adresse e-mail est déjà enregistrée.",
    errorCaptcha: "La vérification de sécurité a échoué. Veuillez réessayer.",
    errorGeneric: "Une erreur inattendue s'est produite lors du traitement de votre demande.",
  },
};

type Locale = keyof typeof i18n;

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
  const rawLocale = (formData.get("locale") as string) || "es";
  const locale: Locale = (["es", "en", "pt", "fr"].includes(rawLocale) ? rawLocale : "es") as Locale;
  const tx = i18n[locale];

  // 1. Honeypot
  if (honeypot) {
    console.warn("Bot detectado en el Honeypot.");
    return { success: true, message: tx.successMessage };
  }

  // 2. Cloudflare Turnstile
  const verifyEndpoint = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
  const verifyResponse = await fetch(verifyEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `secret=${process.env.CLOUDFLARE_TURNSTILE_SECRET}&response=${turnstileToken}`,
  });
  const verifyData = await verifyResponse.json();
  if (!verifyData.success) {
    return { error: tx.errorCaptcha };
  }

// 🏢 Tenant — Upstash Redis cache
const { getTenantId } = await import('@/lib/tenant-cache');
const slug = process.env.TENANT_SLUG || 'gaspmaker';
const tenantId = await getTenantId(slug);

  try {
    // 3. Duplicados
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { error: tx.errorDuplicate };
    }

    // 4. Hash + tokens
    const hashedPassword = await bcrypt.hash(password, 10);
    const token = nanoid(32);
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const country = countryCode || "US";
    const suiteNo = generateLockerNumber(country);
    const finalDate = dateOfBirth ? new Date(dateOfBirth) : null;

   await prisma.$transaction([
prisma.user.create({
  data: {
    email, name, password: hashedPassword, suiteNo,
    role: "CLIENTE", countryCode: country, phone,
    dateOfBirth: finalDate, referredBy: referredBy || null,
    emailVerified: null,
    tenant_id: tenantId, // ← AGREGAR
  },
}),
  prisma.verificationToken.create({
    data: { identifier: email, token, expires: expirationDate },
  }),
]);

    // 5. Email en el idioma del cliente
    const confirmLink = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify-email?token=${token}`;

    await resend.emails.send({
      from: "Gasp Maker Cargo <no-reply@gaspmakercargo.com>",
      to: email,
      subject: tx.emailSubject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; color: #333;">
          <h2 style="color: #111; text-align: center;">${tx.emailGreeting(name)}</h2>
          <p>${tx.emailIntro}</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1px;">${tx.emailSuiteLabel}</p>
            <p style="margin: 10px 0 0 0; font-size: 26px; font-weight: bold; color: #111;">${suiteNo}</p>
          </div>
          <p>${tx.emailCta}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmLink}" style="background-color: #FBBF24; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">${tx.emailBtn}</a>
          </div>
          <p style="font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 15px;">
            ${tx.emailFooter}
          </p>
        </div>
      `,
    });

    return { success: true, message: tx.successMessage };

  } catch (error) {
    console.error("Error en el proceso de registro:", error);
    return { error: tx.errorGeneric };
  }
}