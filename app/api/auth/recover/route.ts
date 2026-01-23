import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Resend } from 'resend';
import { v4 as uuidv4 } from 'uuid'; // Necesitas: npm install uuid @types/uuid

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // 1. Verificar si el usuario existe
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Por seguridad, respondemos OK aunque no exista el email
      return NextResponse.json({ message: 'Email sent' }, { status: 200 });
    }

    // 2. Generar Token y Expiración (1 hora)
    const token = uuidv4();
    const expiry = new Date(Date.now() + 3600000); // 1 hora desde ahora

    // 3. Guardar en Base de Datos
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry
      }
    });

    // 4. Construir el Link
    // Usamos NEXT_PUBLIC_BASE_URL de tu .env
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/es/restablecer-contrasena?token=${token}`;

    // 5. Enviar Email con Resend
    await resend.emails.send({
      from: 'Gasp Maker Cargo <onboarding@resend.dev>', // O tu dominio verificado
      to: email,
      subject: 'Recuperar tu contraseña - Gasp Maker Cargo',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Recuperación de Contraseña</h1>
          <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
          <p>Haz clic en el siguiente botón para crear una nueva:</p>
          <a href="${resetLink}" style="background-color: #FBBF24; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Restablecer Contraseña
          </a>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">
            Si no solicitaste esto, ignora este mensaje. El enlace expira en 1 hora.
          </p>
        </div>
      `
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Recover error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}