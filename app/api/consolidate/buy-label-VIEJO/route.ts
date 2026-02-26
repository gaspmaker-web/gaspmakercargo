import { NextResponse } from 'next/server';

// 👇 VACUNA 1: Forzar modo dinámico
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 👇 VACUNA 2: Imports Lazy Loading
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;
    const easypost = (await import("@/lib/easypost")).default;

    // 1. Verificar Admin (Seguridad extra para esta ruta)
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: "No autorizado. Solo Admins." }, { status: 401 });
    }

    const { consolidationId } = await req.json();

    // 2. Buscar la Consolidación y el Usuario
    const consolidation = await prisma.consolidatedShipment.findUnique({
      where: { id: consolidationId },
      include: { user: true }
    });

    if (!consolidation) return NextResponse.json({ error: "Consolidación no encontrada" }, { status: 404 });
    
    // Validar Courier
    if (!consolidation.selectedCourier) {
        return NextResponse.json({ error: "La consolidación no tiene courier asignado." }, { status: 400 });
    }
    
    const courierName = consolidation.selectedCourier.toLowerCase();
    if (courierName.includes('gasp') || courierName.includes('maritimo')) {
        return NextResponse.json({ error: "Para Gasp Maker usa el despacho manual." }, { status: 400 });
    }

    // =========================================================================
    // 🔥 MODO ESTRICTO NIVEL AMAZON: LEER LA DIRECCIÓN REAL DE LA BASE DE DATOS
    // =========================================================================
    let toAddress: any = {};

    if (consolidation.shippingAddress) {
        // Ejemplo: "ADENIN LEON | 485 E 188TH ST APT 1F, BRONX NY 10458, US | Tel: 123456789"
        const parts = consolidation.shippingAddress.split('|');
        const name = parts[0]?.trim() || consolidation.user.name;
        const addressBlock = parts[1]?.trim() || '';
        const phoneBlock = parts[2]?.trim() || '';

        // Extraer teléfono
        let phone = phoneBlock.replace(/[^0-9]/g, '');
        if (phone.length < 10) phone = '7862820763';

        // Partir el bloque de dirección
        const addrChunks = addressBlock.split(',').map(c => c.trim());
        const countryRaw = addrChunks.pop() || 'US'; 
        let destinationCountry = countryRaw.length > 2 ? (countryRaw.toUpperCase().includes('TRINIDAD') ? 'TT' : 'US') : countryRaw.toUpperCase();

        const cityZipChunk = addrChunks.pop() || '';
        const streetChunk = addrChunks.join(', ') || 'N/A';

        const zip = cityZipChunk.match(/\d{4,}/)?.[0] || '00000';
        const stateMatch = cityZipChunk.match(/\b[A-Z]{2}\b/);
        const state = stateMatch ? stateMatch[0] : (destinationCountry === 'US' ? 'FL' : undefined);
        const city = cityZipChunk.replace(zip, '').replace(state || '', '').replace(/[^a-zA-Z\s]/g, '').trim() || 'City';

        toAddress = {
            name: name,
            street1: streetChunk,
            city: city,
            state: state,
            zip: zip,
            country: destinationCountry,
            phone: phone
        };
    } else {
        // 🔒 CANDADO DE SEGURIDAD
        return NextResponse.json({ error: "⚠️ MODO ESTRICTO: Esta consolidación no tiene una dirección válida asignada. Por favor, asegúrese de que el cliente haya pagado con una dirección seleccionada." }, { status: 400 });
    }

    // 👇 4. INFORMACIÓN DE ADUANAS 🛃
    const customsItem = {
        description: 'Consolidated Personal Effects', // Descripción genérica para consolidaciones
        quantity: 1,
        value: parseFloat(consolidation.declaredValue as any) || 10.0, 
        weight: (parseFloat(consolidation.weightLbs as any) || 1) * 16,
        origin_country: 'US', 
        hs_tariff_number: '650500'
    };

    const customsInfo = {
        eel_pfc: 'NOEEI 30.37(a)',
        customs_certify: true,
        customs_signer: 'GaspMaker Agent',
        contents_type: 'merchandise',
        restriction_type: 'none',
        non_delivery_option: 'return',
        customs_items: [customsItem]
    };

    // 5. Crear Envío EasyPost
    const shipment = await easypost.Shipment.create({
      to_address: toAddress, // 👈 ¡AQUÍ INYECTAMOS LA DIRECCIÓN GANADORA!
      from_address: {
        company: 'GaspMaker Cargo',
        street1: '1861 NW 22nd St',
        city: 'Miami',
        state: 'FL',
        zip: '33142',
        country: 'US',
        phone: '7862820763'
      },
      parcel: {
        length: parseFloat(consolidation.lengthIn as any) || 10,
        width: parseFloat(consolidation.widthIn as any) || 10,
        height: parseFloat(consolidation.heightIn as any) || 10,
        weight: (parseFloat(consolidation.weightLbs as any) || 1) * 16
      },
      customs_info: customsInfo
    });

    if (!shipment.rates || shipment.rates.length === 0) {
        throw new Error(`EasyPost no devolvió tarifas para la consolidación seleccionada.`);
    }

    // 6. Selección de Tarifa (Smart Fallback)
    let selectedRate;
    const carrierRates = shipment.rates.filter((r: any) => 
        r.carrier.toLowerCase().includes(courierName)
    );

    if (carrierRates.length > 0) {
        if (consolidation.courierService) {
            selectedRate = carrierRates.find((r: any) => r.service === consolidation.courierService);
        }
        if (!selectedRate) {
            selectedRate = carrierRates.sort((a: any, b: any) => parseFloat(a.rate) - parseFloat(b.rate))[0];
        }
    } else {
        selectedRate = shipment.rates.sort((a: any, b: any) => parseFloat(a.rate) - parseFloat(b.rate))[0];
    }

    if (!selectedRate) {
        return NextResponse.json({ error: `No hay tarifa para ${consolidation.selectedCourier}.` }, { status: 400 });
    }

    // 7. COMPRAR
    const boughtShipment = await easypost.Shipment.buy(shipment.id, selectedRate.id);

    // 8. GUARDAR EN BASE DE DATOS
    await prisma.consolidatedShipment.update({
        where: { id: consolidationId },
        data: {
            status: 'ENVIADO', 
            finalTrackingNumber: boughtShipment.tracker.tracking_code,
            shippingLabelUrl: boughtShipment.postage_label.label_url, 
            courierService: `${boughtShipment.selected_rate.carrier} - ${boughtShipment.selected_rate.service}`
        }
    });

    // 9. ACTUALIZAR LOS PAQUETES HIJOS A "ENVIADO" (OPCIONAL PERO RECOMENDADO)
    await prisma.package.updateMany({
        where: { consolidatedShipmentId: consolidationId },
        data: {
            status: 'ENVIADO',
            finalTrackingNumber: boughtShipment.tracker.tracking_code
        }
    });

    return NextResponse.json({ 
        success: true, 
        tracking: boughtShipment.tracker.tracking_code,
        label: boughtShipment.postage_label.label_url 
    });

  } catch (error: any) {
    console.error("EasyPost Consolidation Error:", error);
    const msg = error.error?.message || error.message || "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}