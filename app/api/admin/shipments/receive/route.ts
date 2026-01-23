import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    // Validar permisos
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE')) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { shipmentId } = await req.json();

    if (!shipmentId) {
        return NextResponse.json({ message: "Falta ID" }, { status: 400 });
    }

    // 1. Actualizamos el Shipment (La caja padre)
    const updatedShipment = await prisma.consolidatedShipment.update({
        where: { id: shipmentId },
        data: {
            status: 'EN_REPARTO', // O 'EN_ALMACEN_DESTINO' según tu lógica
            updatedAt: new Date()
        }
    });

    // 2. Actualizamos TODOS los paquetes hijos
    // Esto es vital para que el cliente vea que sus paquetes individuales avanzaron
    await prisma.package.updateMany({
        where: { consolidatedShipmentId: shipmentId },
        data: {
            status: 'EN_REPARTO',
            updatedAt: new Date()
        }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error receiving shipment:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}