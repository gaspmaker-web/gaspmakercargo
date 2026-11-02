import { getMobileUser } from '@/lib/getMobileUser';
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const { auth } = await import('@/auth');
        const session = await auth();
        const mobileUser = await getMobileUser(req);
        const userId = session?.user?.id || mobileUser?.id;
        if (!userId) {
            return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
        }

    // 🔥 ACTUALIZADO: Extraemos las piezas limpias del body
    const { 
      id, 
      fullName, 
      address, 
      city,    // <--- Nueva pieza
      state,   // <--- Nueva pieza
      zip,     // <--- Nueva pieza
      cityZip, 
      country, 
      phone 
    } = await req.json();

    // 🚀 ACTUALIZACIÓN ENTERPRISE: Limpiando los NULLs de registros viejos
    const updatedAddress = await prisma.address.update({
      where: { id: id },
      data: { 
        fullName, 
        address, 
        // 🔥 AL EDITAR, LLENAMOS LAS GAVETAS DE AURA
        city: city || null,
        state: state || null,
        zip: zip || null,
        
        cityZip, 
        country, 
        phone 
      },
    });

    return NextResponse.json({ 
      message: "Dirección actualizada", 
      address: updatedAddress 
    }, { status: 200 });

  } catch (error) {
    console.error("Error actualizando dirección:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}