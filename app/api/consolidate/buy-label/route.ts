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
    // NOTA: Incluimos 'packages' por si quieres iterar sobre ellos, pero usaremos el peso total de la consolidación
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

    // 👇 3. LÓGICA DE DIRECCIÓN (IDÉNTICA A PAQUETES) 🌍
    
    // A. País
    let destinationCountry = consolidation.user.country?.trim().toUpperCase();
    
    if (!destinationCountry) {
        // Fallback al profile si es estrictamente necesario, pero idealmente debe venir del envío
        destinationCountry = consolidation.user.countryCode?.trim().toUpperCase(); 
    }

    if (!destinationCountry) return NextResponse.json({ error: "Falta país de destino." }, { status: 400 });

    // Normalización
    if (destinationCountry.length > 2) {
        if (destinationCountry.includes('TRINIDAD')) destinationCountry = 'TT';
        else if (destinationCountry.includes('UNITED')) destinationCountry = 'US';
    }

    // B. Teléfono
    let cleanPhone = consolidation.user.phone?.replace(/[^0-9]/g, '') || '';
    if (cleanPhone.length < 10) cleanPhone = '7862820763'; 

    // C. Ciudad y Zip
    const rawLocation = consolidation.user.cityZip || ''; 
    const city = rawLocation.split(',')[0].replace(/\d+/g, '').trim() || 'City'; 
    const zip = rawLocation.match(/\d{4,}/)?.[0] || '00000';

    // D. Estado
    let state = undefined;
    if (destinationCountry === 'US' || destinationCountry === 'CA') {
        const stateMatch = rawLocation.match(/\b[A-Z]{2}\b/);
        state = stateMatch ? stateMatch[0] : (destinationCountry === 'US' ? 'FL' : undefined);
    }

    console.log(`📦 Consolidación Target: ${city}, ${destinationCountry} (State: ${state})`);

    // 👇 4. INFORMACIÓN DE ADUANAS (Agregada) 🛃
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
      to_address: {
        name: consolidation.user.name,
        street1: consolidation.user.address,
        city: city,
        state: state, 
        zip: zip,
        country: destinationCountry,
        phone: cleanPhone
      },
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
        throw new Error(`EasyPost no devolvió tarifas para consolidación a ${destinationCountry}.`);
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

    // 8. GUARDAR EN BASE DE DATOS (Actualizamos ConsolidatedShipment)
    await prisma.consolidatedShipment.update({
        where: { id: consolidationId },
        data: {
            status: 'ENVIADO', // O el estado que uses para "Enviado"
            finalTrackingNumber: boughtShipment.tracker.tracking_code,
            shippingLabelUrl: boughtShipment.postage_label.label_url, // Ojo: Verifica si tu campo se llama receiptUrl o shippingLabelUrl en esta tabla
            courierService: `${boughtShipment.selected_rate.carrier} - ${boughtShipment.selected_rate.service}`
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