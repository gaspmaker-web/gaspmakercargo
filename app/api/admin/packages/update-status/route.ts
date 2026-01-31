import { NextResponse } from "next/server";

// 👇 Forzar modo dinámico para Vercel
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

    if (!packageId || !newStatus) {
        return NextResponse.json({ message: "Faltan datos (ID o Status)" }, { status: 400 });
    }

    console.log(`🔄 Actualizando estado: ${packageId} -> ${newStatus}`);

    // 1. INTENTO A: Actualizar como Consolidación (Devuelve un contador 'count')
    const consolidationResult = await prisma.consolidatedShipment.updateMany({
        where: { id: packageId },
        data: { status: newStatus, updatedAt: new Date() }
    });

    // Si encontró y actualizó alguna consolidación (count > 0)
    if (consolidationResult.count > 0) {
        // Actualizamos también sus paquetes hijos
        await prisma.package.updateMany({
            where: { consolidatedShipmentId: packageId },
            data: { status: newStatus, updatedAt: new Date() }
        });
        
        return NextResponse.json({ success: true, message: "Consolidación actualizada" });
    }

    // 2. INTENTO B: Si count fue 0, intentamos actualizar como Paquete Suelto
    // (Esto devuelve un objeto completo, no un count)
    const packageResult = await prisma.package.update({
        where: { id: packageId },
        data: { status: newStatus, updatedAt: new Date() }
    });

    return NextResponse.json({ success: true, data: packageResult });

  } catch (error: any) {
    console.error("🔥 Error en update-status:", error);
    // Manejo elegante si el ID no existe en ninguna tabla
    if (error.code === 'P2025') {
        return NextResponse.json({ message: "ID no encontrado en el sistema" }, { status: 404 });
    }
    return NextResponse.json({ message: error.message || "Error interno" }, { status: 500 });
  }
}