import { NextResponse } from "next/server";

// 👇 Esto asegura que funcione en Vercel sin problemas de caché
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const prisma = (await import("@/lib/prisma")).default;
    const { auth } = await import("@/auth");

    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { packageId, newStatus } = body;

    // Validación
    if (!packageId || !newStatus) {
        return NextResponse.json({ message: "Faltan datos (ID o Status)" }, { status: 400 });
    }

    console.log(`🔄 Actualizando estado: ${packageId} -> ${newStatus}`);

    // 👇 AQUÍ ESTÁ LA MAGIA:
    // Al poner 'EN_REPARTO', tu App de Driver lo detectará automáticamente.
    
    // 1. Intentamos actualizar si es Consolidación
    let updated = await prisma.consolidatedShipment.updateMany({
        where: { id: packageId },
        data: { status: newStatus, updatedAt: new Date() }
    });

    // 2. Si no actualizó nada (count 0), intentamos como Paquete Suelto
    if (updated.count === 0) {
        updated = await prisma.package.update({
            where: { id: packageId },
            data: { status: newStatus, updatedAt: new Date() }
        });
    } else {
        // Si ERA consolidación, actualizamos también sus paquetes hijos
        await prisma.package.updateMany({
            where: { consolidatedShipmentId: packageId },
            data: { status: newStatus, updatedAt: new Date() }
        });
    }

    return NextResponse.json({ success: true, message: "Estado actualizado" });

  } catch (error: any) {
    console.error("🔥 Error en update-status:", error);
    return NextResponse.json({ message: error.message || "Error interno" }, { status: 500 });
  }
}