import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs'; // Asegúrate de tener: npm install bcryptjs @types/bcryptjs

export async function POST(req: Request) {
  try {
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

    // 3. Actualizar usuario y LIMPIAR el token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,       // Borramos el token para que no se use de nuevo
        resetTokenExpiry: null
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}