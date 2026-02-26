import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;

    const session = await auth();
    if (!session || !session.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const userId = session.user.id;

    // 1. Buscamos en la nueva libreta de direcciones
    let addresses = await prisma.address.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' }
    });

    // 2. 🔥 MIGRACIÓN AUTOMÁTICA PARA CLIENTES VIEJOS
    // Si la libreta nueva está vacía, buscamos si tiene una dirección vieja en su perfil
    if (addresses.length === 0) {
        const userProfile = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, address: true, cityZip: true, country: true, countryCode: true, phone: true }
        });

        // Si el usuario viejo sí tenía una dirección guardada, se la convertimos en Tarjeta
        if (userProfile && userProfile.address && userProfile.address.trim() !== '') {
            const migratedAddress = await prisma.address.create({
                data: {
                    userId: userId,
                    fullName: userProfile.name || 'Cliente',
                    address: userProfile.address,
                    cityZip: userProfile.cityZip || '',
                    // Usamos la columna correcta dependiendo de dónde tenías guardado el país
                    country: userProfile.country || userProfile.countryCode || 'US', 
                    phone: userProfile.phone || '',
                    isDefault: true // La coronamos como la principal automáticamente
                }
            });
            
            // Metemos la nueva tarjeta en la lista para que la pantalla la dibuje al instante
            addresses = [migratedAddress];
        }
    }

    return NextResponse.json({ addresses }, { status: 200 });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}