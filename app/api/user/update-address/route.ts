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

    const { address, cityZip, country, phone } = await req.json();

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        address, 
        cityZip, 
        country, 
        phone // Actualizamos también el teléfono aquí si se desea
      },
    });

    return NextResponse.json({ message: "Dirección actualizada", user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Error actualizando dirección:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}