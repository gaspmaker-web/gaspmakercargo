import { getMobileUser } from '@/lib/getMobileUser';
import { NextResponse } from "next/server";

// 👇 VACUNA 1: Forzar modo dinámico
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 👇 VACUNA 2: Imports dentro de la función (Lazy Loading)
    const { auth } = await import('@/auth');
        const session = await auth();
        const mobileUser = await getMobileUser(req);
        const userId = session?.user?.id || mobileUser?.id;
        if (!userId) {
            return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
        }

    const { countryCode: rawCode } = await req.json();
    const countryCode = rawCode?.toUpperCase();

    if (!countryCode) {
      return NextResponse.json({ message: "Código de país requerido" }, { status: 400 });
    }

    // Actualizamos el usuario en la BD
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { countryCode },
    });

    return NextResponse.json({ message: "País actualizado", user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Error actualizando país:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}