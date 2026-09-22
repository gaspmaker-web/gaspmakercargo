import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;
    const { getTenantEasyPost } = await import('@/lib/tenant-easypost');
    const easypost = await getTenantEasyPost(process.env.TENANT_SLUG || 'gaspmaker');

    const session = await auth();
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE')) {
        return NextResponse.json({ message: "No autorizado." }, { status: 401 });
    }

    const { consolidationId } = await req.json();

    const consolidation = await prisma.consolidatedShipment.findUnique({
      where: { id: consolidationId },
      include: { user: true }
    });

    if (!consolidation) return NextResponse.json({ error: "Consolidación no encontrada" }, { status: 404 });
    if (!consolidation.selectedCourier) return NextResponse.json({ error: "Falta asignar Courier" }, { status: 400 });

    const courierName = consolidation.selectedCourier.toLowerCase();
    if (courierName.includes('gasp') || courierName.includes('maritimo')) {
        return NextResponse.json({ error: "Usa despacho manual." }, { status: 400 });
    }

    // 🔥 DIRECCIÓN DESTINO
    let toAddress: any = {};
    if (consolidation.shippingAddress) {
        const parts = consolidation.shippingAddress.split('|');
        const name = parts[0]?.trim() || consolidation.user.name;
        const addressBlock = parts[1]?.trim() || '';
        const phoneBlock = parts[2]?.trim() || '';
        let phone = phoneBlock.replace(/[^0-9]/g, '');
        if (phone.length < 10) phone = '7862820763';
        const addrChunks = addressBlock.split(',').map((c: string) => c.trim());
        const countryRaw = addrChunks.pop() || 'US';
        let destinationCountry = countryRaw.length > 2 ? (countryRaw.toUpperCase().includes('TRINIDAD') ? 'TT' : 'US') : countryRaw.toUpperCase();
        const cityZipChunk = addrChunks.pop() || '';
        const streetChunk = addrChunks.join(', ') || 'N/A';
        const zip = cityZipChunk.match(/\d{4,}/)?.[0] || '00000';
        const stateMatch = cityZipChunk.match(/\b[A-Z]{2}\b/);
        const state = stateMatch ? stateMatch[0] : (destinationCountry === 'US' ? 'FL' : undefined);
        const city = cityZipChunk.replace(zip, '').replace(state || '', '').replace(/[^a-zA-Z\s]/g, '').trim() || 'City';
        toAddress = { name, street1: streetChunk, city, state, zip, country: destinationCountry, phone };
    } else {
        return NextResponse.json({ error: "⚠️ Sin dirección válida asignada." }, { status: 400 });
    }

    const fromAddress = {
        company: 'GaspMaker Cargo',
        street1: '1861 NW 22nd St',
        city: 'Miami',
        state: 'FL',
        zip: '33142',
        country: 'US',
        phone: '7862820763'
    };

    const customsInfo = {
        eel_pfc: 'NOEEI 30.37(a)',
        customs_certify: true,
        customs_signer: 'GaspMaker Agent',
        contents_type: 'merchandise',
        restriction_type: 'none',
        non_delivery_option: 'return',
        customs_items: [{
            description: 'Consolidated Personal Effects',
            quantity: 1,
            value: parseFloat(consolidation.declaredValue as any) || 10.0,
            weight: (parseFloat(consolidation.weightLbs as any) || 1) * 16,
            origin_country: 'US',
            hs_tariff_number: '650500'
        }]
    };

    // 🔥 CAJAS — usa auraDetails si existe, sino usa dimensiones generales
    const auraDetails = typeof consolidation.auraDetails === 'string'
        ? JSON.parse(consolidation.auraDetails)
        : consolidation.auraDetails;

    const boxes = Array.isArray(auraDetails) && auraDetails.length > 0
        ? auraDetails
        : [{
            length: parseFloat(consolidation.lengthIn as any) || 10,
            width: parseFloat(consolidation.widthIn as any) || 10,
            height: parseFloat(consolidation.heightIn as any) || 10,
            weight: parseFloat(consolidation.weightLbs as any) || 1
          }];

    let allTrackings = '';
    let allLabels: string[] = [];
    let primaryLabel = '';
    let carrierUsed = '';
    let serviceUsed = '';
    let updatedAuraDetails: any[] = [];

    if (boxes.length === 1) {
        // 🔥 1 CAJA — shipment normal
        const shipment = await easypost.Shipment.create({
            to_address: toAddress,
            from_address: fromAddress,
            parcel: {
                length: parseFloat(boxes[0].length) || 10,
                width: parseFloat(boxes[0].width) || 10,
                height: parseFloat(boxes[0].height) || 10,
                weight: (parseFloat(boxes[0].weight) || 1) * 16
            },
            customs_info: customsInfo,
            options: { label_format: 'PDF', label_size: '4X6' }
        });

        if (!shipment.rates || shipment.rates.length === 0) throw new Error("EasyPost no devolvió tarifas.");

        let selectedRate;
        const carrierRates = shipment.rates.filter((r: any) => r.carrier.toLowerCase().includes(courierName));
        if (carrierRates.length > 0) {
            selectedRate = consolidation.courierService
                ? carrierRates.find((r: any) => r.service === consolidation.courierService) || carrierRates.sort((a: any, b: any) => parseFloat(a.rate) - parseFloat(b.rate))[0]
                : carrierRates.sort((a: any, b: any) => parseFloat(a.rate) - parseFloat(b.rate))[0];
        } else {
            selectedRate = shipment.rates.sort((a: any, b: any) => parseFloat(a.rate) - parseFloat(b.rate))[0];
        }

        if (!selectedRate) throw new Error("No hay tarifa disponible.");

        const bought = await easypost.Shipment.buy(shipment.id, selectedRate.id);
        allTrackings = bought.tracker.tracking_code;
        primaryLabel = bought.postage_label.label_url;
        allLabels = [primaryLabel];
        carrierUsed = bought.selected_rate.carrier;
        serviceUsed = bought.selected_rate.service;
        updatedAuraDetails = [{ ...boxes[0], boxNumber: 1, tracking: allTrackings, labelUrl: primaryLabel }];

    } else {
        // 🔥 MÚLTIPLES CAJAS — EasyPost Order (multi-piece)
        const orderShipments = boxes.map((box: any) => ({
            parcel: {
                length: parseFloat(box.length) || 10,
                width: parseFloat(box.width) || 10,
                height: parseFloat(box.height) || 10,
                weight: (parseFloat(box.weight) || 1) * 16
            },
            customs_info: customsInfo,
            options: { label_format: 'PDF', label_size: '4X6' }
        }));

        const order = await easypost.Order.create({
            to_address: toAddress,
            from_address: fromAddress,
            shipments: orderShipments
        });

        if (!order.rates || order.rates.length === 0) throw new Error("EasyPost Order no devolvió tarifas.");

        // Seleccionar carrier
        const carrierRates = order.rates.filter((r: any) => r.carrier.toLowerCase().includes(courierName));
        let selectedCarrier = courierName;
        let selectedService = consolidation.courierService || '';

        if (carrierRates.length > 0) {
            const best = consolidation.courierService
                ? carrierRates.find((r: any) => r.service === consolidation.courierService) || carrierRates.sort((a: any, b: any) => parseFloat(a.rate) - parseFloat(b.rate))[0]
                : carrierRates.sort((a: any, b: any) => parseFloat(a.rate) - parseFloat(b.rate))[0];
            selectedCarrier = best.carrier;
            selectedService = best.service;
        } else {
            const best = order.rates.sort((a: any, b: any) => parseFloat(a.rate) - parseFloat(b.rate))[0];
            selectedCarrier = best.carrier;
            selectedService = best.service;
        }

        // 🔥 Comprar todos los labels de una vez
        const boughtOrder = await easypost.Order.buy(order.id, selectedCarrier, selectedService);

        carrierUsed = selectedCarrier;
        serviceUsed = selectedService;

        // Extraer trackings y labels de cada shipment
        const shipments = boughtOrder.shipments || [];
        allLabels = shipments.map((s: any) => s.postage_label?.label_url).filter(Boolean);
        allTrackings = shipments.map((s: any) => s.tracker?.tracking_code).filter(Boolean).join(' | ');
        primaryLabel = allLabels[0];

        updatedAuraDetails = boxes.map((box: any, i: number) => ({
            ...box,
            boxNumber: i + 1,
            tracking: shipments[i]?.tracker?.tracking_code || '',
            labelUrl: shipments[i]?.postage_label?.label_url || ''
        }));
    }

    // 🔥 GUARDAR EN DB
    await prisma.consolidatedShipment.update({
        where: { id: consolidationId },
        data: {
            status: 'ENVIADO',
            finalTrackingNumber: allTrackings,
            shippingLabelUrl: primaryLabel,
            courierService: `${carrierUsed} - ${serviceUsed}`,
            auraDetails: updatedAuraDetails as any
        }
    });

    await prisma.package.updateMany({
        where: { consolidatedShipmentId: consolidationId },
        data: {
            status: 'ENVIADO',
            finalTrackingNumber: allTrackings
        }
    });

    return NextResponse.json({
        success: true,
        boxes: boxes.length,
        tracking: allTrackings,
        label: primaryLabel,
        allLabels,
        shipments: updatedAuraDetails
    });

  } catch (error: any) {
    console.error("API Error:", error);
    const msg = error.error?.message || error.message || "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
