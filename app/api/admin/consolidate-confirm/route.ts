import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;
    const { getTenantId } = await import('@/lib/tenant-cache');
    const { getTenantRates } = await import('@/lib/tenant-rates');
    const tenantSlug = process.env.TENANT_SLUG || 'gaspmaker';
    const tenantId = await getTenantId(tenantSlug);
    const tenantRates = tenantId ? await getTenantRates(tenantId) : {};

    const rate = (concept: string, countryCode?: string, fallback: number = 0): number => {
      const key = countryCode ? `${concept}__${countryCode}` : concept;
      const val = tenantRates[key] ?? fallback;
      return Number(val);
    };

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

    let updateData: any = {
        totalAmount: 0,
        status: "PENDIENTE_PAGO",
        extraCharges: extraCharges || null
    };

    if (isAura && auraPieces && auraPieces.length > 0) {
        let totalRealWeight = 0;
        auraPieces.forEach((p: any) => {
            totalRealWeight += parseFloat(p.weight) || 0;
        });

        updateData.weightLbs = totalRealWeight;
        updateData.lengthIn = parseFloat(auraPieces[0].length) || 0;
        updateData.widthIn = parseFloat(auraPieces[0].width) || 0;
        updateData.heightIn = parseFloat(auraPieces[0].height) || 0;
        updateData.declaredValue = finalValue ? parseFloat(finalValue) : 0;
        updateData.auraDetails = auraPieces;

        const consolidation = await prisma.consolidatedShipment.findUnique({
            where: { id: consolidationId },
            select: { serviceType: true, destinationCountryCode: true }
        });

        if (consolidation?.serviceType === 'OCEAN_CONSOLIDATION' && containerType && containerFee) {
            const l = parseFloat(auraPieces[0].length) || 1;
            const w = parseFloat(auraPieces[0].width) || 1;
            const h = parseFloat(auraPieces[0].height) || 1;
            const totalCuft = (l * w * h) / 1728;

            const countryCode = (consolidation.destinationCountryCode || '').toUpperCase();
            const safeCuft = Math.max(1, totalCuft);
            let fleteBase = 0;
            if (safeCuft <= 5)       fleteBase = rate('ocean_min_1_5cuft',   countryCode, 77);
            else if (safeCuft <= 10) fleteBase = rate('ocean_min_6_10cuft',  countryCode, 123);
            else if (safeCuft <= 15) fleteBase = rate('ocean_min_11_15cuft', countryCode, 155);
            else if (safeCuft <= 20) fleteBase = rate('ocean_min_16_20cuft', countryCode, 195);
            else if (safeCuft <= 25) fleteBase = rate('ocean_min_21_25cuft', countryCode, 255);
            else                     fleteBase = parseFloat((safeCuft * rate('ocean_per_cuft', countryCode, 10.20)).toFixed(2));

            const containerCost = parseFloat(containerFee) || 0;
            const subtotal = fleteBase + containerCost;

            updateData.subtotalAmount = subtotal;
            updateData.processingFee = 0;
            updateData.totalAmount = 0;
            updateData.extraCharges = {
                ...(extraCharges || {}),
                containerType,
                containerFee: containerCost,
                fleteBase,
                totalCuft: parseFloat(totalCuft.toFixed(2))
            };
        } else if (containerType && containerFee) {
            updateData.subtotalAmount = parseFloat(containerFee) || 0;
            updateData.extraCharges = {
                ...(extraCharges || {}),
                containerType,
                containerFee: parseFloat(containerFee) || 0
            };
        }

    } else {
        updateData.weightLbs = parseFloat(finalWeight);
        updateData.lengthIn = finalDimensions?.length || 0;
        updateData.widthIn = finalDimensions?.width || 0;
        updateData.heightIn = finalDimensions?.height || 0;
        updateData.declaredValue = finalValue ? parseFloat(finalValue) : 0;
    }

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
