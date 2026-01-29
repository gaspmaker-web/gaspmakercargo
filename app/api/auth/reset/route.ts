import { NextResponse } from 'next/server';

// 👇 VACUNA 1: Forzar modo dinámico
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 👇 VACUNA 2: Imports dentro de la función (Lazy Loading)
    const prisma = (await import("@/lib/prisma")).default;
    const bcrypt = (await import("bcryptjs")).default;

    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    // 1. Buscar usuario con ese token y que NO haya expirado
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date() // Que la fecha de expiración sea MAYOR a ahora (no vencido)
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 400 });
    }

    // 2. Encriptar nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Actualizar (CORREGIDO: Guardamos el hash en 'password')
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // password_hash: hashedPassword, <--- ❌ ELIMINADO PORQUE NO EXISTE EN DB
        password: hashedPassword,         // ✅ GUARDAMOS EL HASH AQUÍ
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}