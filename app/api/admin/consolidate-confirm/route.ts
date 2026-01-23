import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();

    // 1. Seguridad
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE')) {
      return NextResponse.json({ message: "No autorizado." }, { status: 401 });
    }

    // 👇 AQUÍ AGREGAMOS 'finalValue' PARA RECIBIRLO DEL MODAL
    const { consolidationId, finalWeight, finalDimensions, finalValue } = await req.json();

    // 2. CORRECCIÓN: No calculamos precio aquí.
    // El precio depende del courier que el cliente elija después.
    // Inicializamos en 0.
    
    // 3. Actualizar la Consolidación
    const updatedConsolidation = await prisma.consolidatedShipment.update({
      where: { id: consolidationId },
      data: {
        weightLbs: finalWeight,
        lengthIn: finalDimensions.length,
        widthIn: finalDimensions.width,
        heightIn: finalDimensions.height,
        
        // 🔥 NUEVO: Guardamos el Valor Declarado para el seguro (Default 0 si no se envía)
        declaredValue: finalValue ? parseFloat(finalValue) : 0,

        totalAmount: 0, // <--- CAMBIO CLAVE: Se inicia en 0
        status: "PENDIENTE_PAGO",
      },
    });

    return NextResponse.json({ success: true, data: updatedConsolidation });

  } catch (error: any) {
    console.error("Error confirmando consolidación:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}