import { NextResponse } from "next/server";

// 1. Mantenemos esto para seguridad
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 👇 TRUCO DE MAGIA: Importamos Auth y Prisma AQUÍ DENTRO, no arriba.
    // Esto evita que Vercel intente conectarse durante el Build.
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;

    const session = await auth();

    // 1. Seguridad
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE')) {
      return NextResponse.json({ message: "No autorizado." }, { status: 401 });
    }

    const { consolidationId, finalWeight, finalDimensions, finalValue } = await req.json();

    // 2. Actualizar la Consolidación
    const updatedConsolidation = await prisma.consolidatedShipment.update({
      where: { id: consolidationId },
      data: {
        weightLbs: finalWeight,
        lengthIn: finalDimensions.length,
        widthIn: finalDimensions.width,
        heightIn: finalDimensions.height,
        declaredValue: finalValue ? parseFloat(finalValue) : 0,
        totalAmount: 0,
        status: "PENDIENTE_PAGO",
      },
    });

    return NextResponse.json({ success: true, data: updatedConsolidation });

  } catch (error: any) {
    console.error("Error confirmando consolidación:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}