import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;

    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    // 🔥 ACTUALIZADO: Ahora extraemos las piezas limpias que vienen del nuevo Modal
    const { 
      fullName, 
      address, 
      city,    // <--- Nueva pieza
      state,   // <--- Nueva pieza
      zip,     // <--- Nueva pieza
      cityZip, 
      country, 
      phone 
    } = await req.json();

    // Verificamos si es la primera dirección para marcarla como DEFAULT
    const count = await prisma.address.count({ 
      where: { userId: session.user.id } 
    });
    const isDefault = count === 0;

    // 🚀 GUARDADO ENTERPRISE: Sin NULLs en las nuevas columnas
    const newAddress = await prisma.address.create({
      data: {
        fullName,
        address,
        // 🔥 REGISTRO DE DATOS LIMPIOS: Esto activa a Aura automáticamente
        city: city || null,
        state: state || null,
        zip: zip || null,
        
        cityZip, // Mantenemos este para compatibilidad
        country,
        isDefault,
        userId: session.user.id
      },
    });

    return NextResponse.json({ message: "Dirección creada", address: newAddress }, { status: 200 });
  } catch (error) {
    console.error("Error creando dirección:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}