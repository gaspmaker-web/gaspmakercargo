import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;

    const session = await auth();
    if (!session || !session.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const { id, fullName, address, cityZip, country, phone } = await req.json();

    const updatedAddress = await prisma.address.update({
      where: { id: id },
      data: { fullName, address, cityZip, country, phone },
    });

    return NextResponse.json({ message: "Dirección actualizada", address: updatedAddress }, { status: 200 });
  } catch (error) {
    console.error("Error actualizando dirección:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}