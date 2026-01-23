import { NextResponse } from "next/server";

// 👇 VACUNA 1: Forzar modo dinámico (Para evitar errores de Build)
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 👇 VACUNA 2: Imports dentro de la función (Lazy Loading)
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;
    // Importamos bcrypt de forma dinámica para que no rompa el build estático
    const bcrypt = (await import("bcryptjs")).default; 

    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: "Faltan datos" }, { status: 400 });
    }

    // 1. Buscar al usuario para obtener su hash actual
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !user.password_hash) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }

    // 2. Verificar que la contraseña actual sea correcta
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ message: "La contraseña actual es incorrecta" }, { status: 400 });
    }

    // 3. Hashear la nueva contraseña
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // 4. Actualizar en BD
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password_hash: newPasswordHash },
    });

    return NextResponse.json({ message: "Contraseña actualizada" }, { status: 200 });
  } catch (error) {
    console.error("Error actualizando password:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}