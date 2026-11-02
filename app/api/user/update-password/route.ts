import { getMobileUser } from '@/lib/getMobileUser';
import { NextResponse } from "next/server";

// 👇 VACUNA 1: Forzar modo dinámico (Para evitar errores de Build)
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 👇 VACUNA 2: Imports dentro de la función (Lazy Loading)
    const prisma = (await import('@/lib/prisma')).default;
    const bcrypt = (await import('bcryptjs')).default;
    const { auth } = await import('@/auth');
        const session = await auth();
        const mobileUser = await getMobileUser(req);
        const userId = session?.user?.id || mobileUser?.id;
        if (!userId) {
            return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
        }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: "Faltan datos" }, { status: 400 });
    }

    // 1. Buscar al usuario para obtener su hash actual
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }

    // Si el usuario tiene contraseña, verificar la actual
    if (user.password) {
      if (!currentPassword) {
        return NextResponse.json({ message: "Debes ingresar tu contraseña actual" }, { status: 400 });
      }
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ message: "La contraseña actual es incorrecta" }, { status: 400 });
      }
    }
    // Si no tiene contraseña (cuenta Google), permitir establecerla directamente

    // 3. Hashear la nueva contraseña
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // 4. Actualizar en BD
    // 🔴 CAMBIO: Guardamos en 'password'
    await prisma.user.update({
      where: { id: userId },
      data: { password: newPasswordHash },
    });

    return NextResponse.json({ message: "Contraseña actualizada" }, { status: 200 });
  } catch (error) {
    console.error("Error actualizando password:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}