import { NextResponse } from "next/server";

// 👇 VACUNA 1: Forzar modo dinámico
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 👇 VACUNA 2: Imports dentro de la función (Lazy Loading)
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;

    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { countryCode } = await req.json();

    if (!countryCode) {
      return NextResponse.json({ message: "Código de país requerido" }, { status: 400 });
    }

    // Actualizamos el usuario en la BD
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { countryCode },
    });

    return NextResponse.json({ message: "País actualizado", user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Error actualizando país:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}