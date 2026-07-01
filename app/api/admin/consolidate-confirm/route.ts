import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;

    const session = await auth();

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE')) {
      return NextResponse.json({ message: "No autorizado." }, { status: 401 });
    }

    const { 
        consolidationId, 
        finalWeight, 
        finalDimensions, 
        finalValue,
        isAura,
        auraPieces,
        extraCharges,
        containerType,
        containerFee
    } = await req.json();

    // 🚢 RATE ENGINE MARÍTIMO
    function calculateOceanRate(cuft: number): number {
        const safeCuft = Math.max(1, cuft);
        if (safeCuft <= 5)  return 77.00;
        if (safeCuft <= 10) return 123.00;
        if (safeCuft <= 15) return 155.00;
        if (safeCuft <= 20) return 195.00;
        if (safeCuft <= 25) return 255.00;
        return parseFloat((safeCuft * 10.20).toFixed(2));
    }

    // 🔥 REGLA DE ORO: El precio inicia en 0 hasta que el cliente elija envío
    let updateData: any = {
        totalAmount: 0,
        status: "PENDIENTE_PAGO",
        extraCharges: extraCharges || null
    };

    // 🚦 SEMÁFORO: ¿Es Local Delivery, Ocean o Aéreo?
    if (isAura && auraPieces && auraPieces.length > 0) {
        let totalRealWeight = 0;
        
        auraPieces.forEach((p: any) => {
            totalRealWeight += parseFloat(p.weight) || 0;
        });

        updateData.weightLbs = totalRealWeight;
        updateData.lengthIn = parseFloat(auraPieces[0].length) || 0;
        updateData.widthIn = parseFloat(auraPieces[0].width) || 0;
        updateData.heightIn = parseFloat(auraPieces[0].height) || 0;
        updateData.declaredValue = 0;
        updateData.auraDetails = auraPieces;

        // Obtenemos el serviceType de la consolidación
        const consolidation = await prisma.consolidatedShipment.findUnique({
            where: { id: consolidationId },
            select: { serviceType: true, destinationCountryCode: true }
        });

        if (consolidation?.serviceType === 'OCEAN_CONSOLIDATION' && containerType && containerFee) {
            // 🚢 OCEAN: Calcular flete + container fee
            const l = parseFloat(auraPieces[0].length) || 1;
            const w = parseFloat(auraPieces[0].width) || 1;
            const h = parseFloat(auraPieces[0].height) || 1;
            const totalCuft = (l * w * h) / 1728;

            const fleteBase = calculateOceanRate(totalCuft);
            const containerCost = parseFloat(containerFee) || 0;
            const subtotal = fleteBase + containerCost;
            const processingFee = parseFloat((subtotal * 0.029 + 0.30).toFixed(2));
            const total = parseFloat((subtotal + processingFee).toFixed(2));

          updateData.subtotalAmount = subtotal;
        updateData.processingFee = 0;
        updateData.totalAmount = 0;  // ← Se calcula cuando el cliente selecciona courier
            updateData.extraCharges = {
                ...(extraCharges || {}),
                containerType,
                containerFee: containerCost,
                fleteBase,
                totalCuft: parseFloat(totalCuft.toFixed(2))
            };
        } else if (containerType && containerFee) {
            // 🚚 LOCAL DELIVERY con container
            updateData.subtotalAmount = parseFloat(containerFee) || 0;
            updateData.extraCharges = {
                ...(extraCharges || {}),
                containerType,
                containerFee: parseFloat(containerFee) || 0
            };
        }

    } else {
        // ✈️ FLUJO AÉREO ORIGINAL
        updateData.weightLbs = parseFloat(finalWeight);
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