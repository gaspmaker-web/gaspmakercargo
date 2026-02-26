import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;

    const session = await auth();
    if (!session || !session.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const { id } = await req.json();

    // 1. Le quitamos la corona de DEFAULT a todas las direcciones del usuario
    await prisma.address.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false }
    });

    // 2. Le ponemos la corona de DEFAULT a la dirección que el cliente seleccionó
    const newDefault = await prisma.address.update({
      where: { id: id },
      data: { isDefault: true }
    });

    return NextResponse.json({ message: "Default actualizado", address: newDefault }, { status: 200 });
  } catch (error) {
    console.error("Error seteando default:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}