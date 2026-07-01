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

    // 📦 Recibimos TODA la data: la antigua (Aéreo) y la nueva (Aura)
   const { 
    consolidationId, 
    finalWeight, 
    finalDimensions, 
    finalValue,
    isAura,
    auraPieces,
    // 🔥 RECIBIMOS LOS CARGOS ESPECIALES (HAZMAT, EEI, ETC)
    extraCharges,
    // 🚢 CONTAINER MARÍTIMO
    containerType,
    containerFee
} = await req.json();

    // 🔥 REGLA DE ORO: El precio inicia en 0 hasta que el cliente elija envío
    let updateData: any = {
        totalAmount: 0,
        status: "PENDIENTE_PAGO",
        // 🔥 ALMACENAMOS EL JSON DE CARGOS ESPECIALES EN EL REGISTRO
        extraCharges: extraCharges || null
    };

  // 🚦 SEMÁFORO: ¿Es Local Delivery o Aéreo?
if (isAura && auraPieces && auraPieces.length > 0) {
    // 🚚 FLUJO AURA (LOCAL DELIVERY)
    let totalRealWeight = 0;
    
    // Sumamos el peso real de todas las filas ingresadas
    auraPieces.forEach((p: any) => {
        totalRealWeight += parseFloat(p.weight) || 0;
    });

    updateData.weightLbs = totalRealWeight;
    updateData.lengthIn = parseFloat(auraPieces[0].length) || 0;
    updateData.widthIn = parseFloat(auraPieces[0].width) || 0;
    updateData.heightIn = parseFloat(auraPieces[0].height) || 0;
    updateData.declaredValue = 0; // No hay aduanas
    
    // 🚀 MAGIA DE AURA: Guardamos el arreglo completo de pallets en el nuevo bolsillo JSON
    updateData.auraDetails = auraPieces;

    // 🚢 CONTAINER FEE: Se suma al flete marítimo
    if (containerType && containerFee) {
        updateData.subtotalAmount = parseFloat(containerFee) || 0;
        updateData.extraCharges = {
            ...(extraCharges || {}),
            containerType,
            containerFee: parseFloat(containerFee) || 0
        };
    }

} else {
    // ✈️ FLUJO AÉREO ORIGINAL (Se mantiene idéntico)
    updateData.weightLbs = parseFloat(finalWeight);
    // Usamos ? para evitar el error de "undefined reading length"
    updateData.lengthIn = finalDimensions?.length || 0;
    updateData.widthIn = finalDimensions?.width || 0;
    updateData.heightIn = finalDimensions?.height || 0;
    updateData.declaredValue = finalValue ? parseFloat(finalValue) : 0;
}
    // 2. Actualizar la Consolidación en la Base de Datos
    const updatedConsolidation = await prisma.consolidatedShipment.update({
      where: { id: consolidationId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updatedConsolidation });

  } catch (error: any) {
    console.error("Error confirmando consolidación:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}