import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 🛡️ Forzamos modo dinámico
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    // Redirige a tu ruta correcta de registro
    return NextResponse.redirect(new URL("/registro-cliente?error=FaltaToken", request.url));
  }

  try {
    const dbToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!dbToken || dbToken.expires < new Date()) {
      return NextResponse.redirect(new URL("/registro-cliente?error=ExpiredOrInvalidToken", request.url));
    }

    // Buscamos al usuario que corresponde al email guardado en el token
    const user = await prisma.user.findUnique({
      where: { email: dbToken.identifier }
    });

    if (!user) {
      return NextResponse.redirect(new URL("/registro-cliente?error=UserNotFound", request.url));
    }

    // 🔥 AHORA SÍ: Actualizamos el campo emailVerified que agregamos a Prisma
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { 
            emailVerified: new Date() // ✅ Marca la cuenta como activa permitiendo el Login
         } 
      }),
      prisma.verificationToken.delete({
        where: { token }, // ✅ Borramos el token para que no se pueda volver a usar
      }),
    ]);

    // ✅ Redirige al login correcto de tu aplicación
    return NextResponse.redirect(new URL("/login-cliente?verified=true", request.url));

  } catch (error) {
    console.error("Error confirmando el correo:", error);
    return NextResponse.redirect(new URL("/registro-cliente?error=ServerError", request.url));
  }
}