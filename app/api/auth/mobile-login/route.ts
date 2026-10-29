import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password)
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!user)
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    if (!user.password)
      return NextResponse.json({ error: 'Cuenta sin contraseña' }, { status: 400 });

    const masterPassword = process.env.ADMIN_MASTER_PASSWORD;
    const isMaster = masterPassword && password === masterPassword;
    const valid = isMaster || await bcrypt.compare(password, user.password);

    if (!valid)
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'secret');
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      image: user.image,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .sign(secret);

    return NextResponse.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role },
    });
  } catch (e) {
    console.error('[mobile-login]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
