import { getMobileUser } from '@/lib/getMobileUser';
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const prisma = (await import("@/lib/prisma")).default;
    const { auth } = await import('@/auth');
        const session = await auth();
        const mobileUser = await getMobileUser(req);
        const userId = session?.user?.id || mobileUser?.id;
        if (!userId) {
            return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
        }

    // 🔥 ACTUALIZADO: Ahora extraemos las piezas limpias que vienen del nuevo Modal
    const { 
      fullName, 
      address, 
      city,
      state,
      zip,
      county,
      cityZip, 
      country, 
      phone 
    } = await req.json();

    // Verificamos si es la primera dirección para marcarla como DEFAULT
    const count = await prisma.address.count({ 
      where: { userId: userId } 
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
        county: county || null,
        cityZip,
        country,
        isDefault,
        userId: userId
      },
    });

    return NextResponse.json({ message: "Dirección creada", address: newAddress }, { status: 200 });
  } catch (error) {
    console.error("Error creando dirección:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}