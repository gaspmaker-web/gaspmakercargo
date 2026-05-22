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

    // 1. INTENTO A: ¿Es este ID una Consolidación Máster?
    const consolidationResult = await prisma.consolidatedShipment.updateMany({
        where: { id: packageId },
        data: { status: newStatus, updatedAt: new Date() }
    });

    // Si encontró y actualizó alguna consolidación (count > 0)
    if (consolidationResult.count > 0) {
        // Actualizamos también TODOS sus paquetes hijos
        await prisma.package.updateMany({
            where: { consolidatedShipmentId: packageId },
            data: { status: newStatus, updatedAt: new Date() }
        });
        
        return NextResponse.json({ success: true, message: "Consolidación y paquetes hijos actualizados" });
    }

    // 2. INTENTO B: Si no fue consolidación, es un Paquete.
    // Primero averiguamos si este paquete pertenece a una Consolidación Padre.
    const pkg = await prisma.package.findUnique({
        where: { id: packageId },
        select: { consolidatedShipmentId: true }
    });

    if (!pkg) {
        return NextResponse.json({ message: "ID no encontrado en el sistema" }, { status: 404 });
    }

    // 🔥 LA MAGIA DE LA TRANSACCIÓN: Si el paquete tiene un Padre, sincronizamos a toda la familia
    if (pkg.consolidatedShipmentId) {
        await prisma.$transaction([
            // Actualiza el Padre
            prisma.consolidatedShipment.update({
                where: { id: pkg.consolidatedShipmentId },
                data: { status: newStatus, updatedAt: new Date() }
            }),
            // Actualiza al paquete y a todos sus hermanos para evitar desincronización
            prisma.package.updateMany({
                where: { consolidatedShipmentId: pkg.consolidatedShipmentId },
                data: { status: newStatus, updatedAt: new Date() }
            })
        ]);
        return NextResponse.json({ success: true, message: "Paquete hijo actualizado y Consolidación Padre sincronizada" });
    }

    // Si el paquete es verdaderamente suelto (no tiene padre), lo actualizamos normalmente
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