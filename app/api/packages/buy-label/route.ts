import { NextResponse } from 'next/server';
// 🔥 IMPORTAMOS TU SISTEMA NATIVO DE NOTIFICACIONES
import { sendShipmentDispatchedEmail, sendNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;
    const easypost = (await import("@/lib/easypost")).default;

    const session = await auth();
    if (!session?.user) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const { packageId } = await req.json();

    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
      include: { user: true }
    });

    if (!pkg) return NextResponse.json({ error: "Paquete no encontrado" }, { status: 404 });
    if (!pkg.selectedCourier) return NextResponse.json({ error: "Sin courier asignado" }, { status: 400 });

    const courierName = pkg.selectedCourier.toLowerCase();
    if (courierName.includes('gasp') || courierName.includes('maritimo')) {
        return NextResponse.json({ error: "Para Gasp Maker usa el despacho manual." }, { status: 400 });
    }

    let toAddress: any = {};

    if (pkg.shippingAddress) {
        const parts = pkg.shippingAddress.split('|');
        const name = parts[0]?.trim() || pkg.user.name;
        const addressBlock = parts[1]?.trim() || '';
        const phoneBlock = parts[2]?.trim() || '';

        let phone = phoneBlock.replace(/[^0-9]/g, '');
        if (phone.length < 10) phone = '7862820763';

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
        return NextResponse.json({ error: "Este paquete no tiene una dirección válida asignada." }, { status: 400 });
    }

    const customsItem = {
        description: pkg.description || 'Personal Effects', 
        quantity: 1,
        value: parseFloat(pkg.declaredValue as any) || 10.0, 
        weight: (parseFloat(pkg.weightLbs as any) || 1) * 16, 
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

    const shipment = await easypost.Shipment.create({
      to_address: toAddress,
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
        length: parseFloat(pkg.lengthIn as any) || 10,
        width: parseFloat(pkg.widthIn as any) || 6,
        height: parseFloat(pkg.heightIn as any) || 4,
        weight: (parseFloat(pkg.weightLbs as any) || 1) * 16
      },
      customs_info: customsInfo 
    });

    if (!shipment.rates || shipment.rates.length === 0) {
        throw new Error(`EasyPost no devolvió tarifas para la dirección seleccionada.`);
    }

    let selectedRate;
    const carrierRates = shipment.rates.filter((r: any) => 
        r.carrier.toLowerCase().includes(courierName)
    );

    if (carrierRates.length > 0) {
        if (pkg.courierService) {
            selectedRate = carrierRates.find((r: any) => r.service === pkg.courierService);
        }
        if (!selectedRate) {
            selectedRate = carrierRates.sort((a: any, b: any) => parseFloat(a.rate) - parseFloat(b.rate))[0];
        }
    } else {
        selectedRate = shipment.rates.sort((a: any, b: any) => parseFloat(a.rate) - parseFloat(b.rate))[0];
    }

    if (!selectedRate) {
        return NextResponse.json({ error: `No hay tarifa para ${pkg.selectedCourier}.` }, { status: 400 });
    }

    const boughtShipment = await easypost.Shipment.buy(shipment.id, selectedRate.id);

    await prisma.package.update({
        where: { id: packageId },
        data: {
            status: 'ENVIADO',
            finalTrackingNumber: boughtShipment.tracker.tracking_code,
            receiptUrl: boughtShipment.postage_label.label_url,
            shippingLabelUrl: boughtShipment.postage_label.label_url,
            courierService: `${boughtShipment.selected_rate.carrier} - ${boughtShipment.selected_rate.service}`
        }
    });

    // ====================================================================
    // 🔥 MAGIA DE NOTIFICACIONES (EMAIL + CAMPANITA) 🔥
    // ====================================================================
    try {
        const trackingNumber = boughtShipment.tracker.tracking_code;
        const finalCourier = boughtShipment.selected_rate.carrier;

        if (pkg.user && pkg.user.email) {
            // 1. Enviar correo al cliente avisando que el paquete fue despachado
            await sendShipmentDispatchedEmail(
                pkg.user.email,
                pkg.user.name,
                pkg.gmcTrackingNumber || pkg.id, // ID interno (GMC)
                finalCourier, // Transportista (ej. FedEx, USPS)
                trackingNumber, // Tracking oficial
                (pkg.user as any).language || 'es'
            );

            // 2. Notificación interna en su campanita web
            await sendNotification({
                userId: pkg.user.id,
                title: "¡Paquete Despachado! ✈️",
                message: `Tu paquete ha sido despachado con ${finalCourier}. Tracking Oficial: ${trackingNumber}`,
                type: "SUCCESS",
                href: `/dashboard-cliente/rastreo/${pkg.gmcTrackingNumber || pkg.id}`
            });
            
            console.log(`✉️ Email de Despacho (Tracking) enviado a: ${pkg.user.email}`);
        }
    } catch (notifError) {
        console.error("⚠️ Error enviando notificación de despacho (el proceso continuará):", notifError);
    }

    return NextResponse.json({ 
        success: true, 
        tracking: boughtShipment.tracker.tracking_code,
        label: boughtShipment.postage_label.label_url 
    });

  } catch (error: any) {
    const msg = error.error?.message || error.message || "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}