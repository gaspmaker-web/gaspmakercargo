import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;

    const session = await auth();
    if (!session || !session.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const { fullName, address, cityZip, country, phone } = await req.json();

    // Verificamos si es la primera dirección. Si lo es, la hacemos DEFAULT automáticamente.
    const count = await prisma.address.count({ where: { userId: session.user.id } });
    const isDefault = count === 0;

    const newAddress = await prisma.address.create({
      data: {
        fullName, address, cityZip, country, phone, isDefault,
        userId: session.user.id
      },
    });

    return NextResponse.json({ message: "Dirección creada", address: newAddress }, { status: 200 });
  } catch (error) {
    console.error("Error creando dirección:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}