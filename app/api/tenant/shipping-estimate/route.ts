import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const weightLbs = parseFloat(searchParams.get('weight') || '0');
    const lengthIn  = parseFloat(searchParams.get('length') || '0');
    const widthIn   = parseFloat(searchParams.get('width')  || '0');
    const heightIn  = parseFloat(searchParams.get('height') || '0');

    if (!weightLbs) return NextResponse.json({ error: 'Missing weight' }, { status: 400 });

    const prisma = (await import('@/lib/prisma')).default;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { countryCode: true, tenant_id: true }
    });

    const countryCode = (user?.countryCode || '').toUpperCase();
    const tenantId = user?.tenant_id || '079bbfe1-75ff-40a1-8f4f-287d0de6586f';

    if (!countryCode) return NextResponse.json({ error: 'No country configured' }, { status: 400 });

    const rates = await prisma.tenantRate.findMany({
        where: {
            tenantId,
            countryCode,
            concept: { in: ['air_per_lb', 'min_rate', 'min_rate_mid', 'ocean_per_cuft', 'ocean_min_1_5cuft', 'dim_factor'] }
        }
    });

    const getRate = (concept: string) => {
        const r = rates.find(r => r.concept === concept);
        return r ? Number(r.value) : 0;
    };

    const airPerLb    = getRate('air_per_lb');
    const minAir0     = getRate('min_rate');
    const minAir11    = getRate('min_rate_mid');
    const oceanPerCft = getRate('ocean_per_cuft');
    const minOcean    = getRate('ocean_min_1_5cuft');
    const dimFactor   = getRate('dim_factor') || 139;

    const hasAir   = airPerLb > 0;
    const hasOcean = oceanPerCft > 0;

    // 📦 Peso volumétrico
    let chargeableWeight = weightLbs;
    if (lengthIn > 0 && widthIn > 0 && heightIn > 0) {
        const dimWeight = (lengthIn * widthIn * heightIn) / dimFactor;
        chargeableWeight = Math.max(weightLbs, dimWeight);
    }
    chargeableWeight = Math.ceil(chargeableWeight * 2) / 2;

    let estimate = null;

    if (hasAir) {
        let airCost = chargeableWeight * airPerLb;
        if (chargeableWeight <= 10) airCost = Math.max(airCost, minAir0);
        else airCost = Math.max(airCost, minAir11);
        const insurance = airCost * 0.03;
        estimate = {
            serviceType: 'AIR',
            freightCost: parseFloat(airCost.toFixed(2)),
            insurance: parseFloat(insurance.toFixed(2)),
            total: parseFloat((airCost + insurance).toFixed(2)),
            chargeableWeight: parseFloat(chargeableWeight.toFixed(2)),
            dimWeight: lengthIn > 0 ? parseFloat(((lengthIn * widthIn * heightIn) / dimFactor).toFixed(2)) : null,
        };
    } else if (hasOcean) {
        const estCft = chargeableWeight / 10;
        let oceanCost = Math.max(estCft * oceanPerCft, minOcean);
        estimate = {
            serviceType: 'OCEAN',
            freightCost: parseFloat(oceanCost.toFixed(2)),
            insurance: 0,
            total: parseFloat(oceanCost.toFixed(2)),
            chargeableWeight: parseFloat(chargeableWeight.toFixed(2)),
            dimWeight: null,
        };
    }

    return NextResponse.json({ estimate, countryCode, weightLbs, chargeableWeight });
}
