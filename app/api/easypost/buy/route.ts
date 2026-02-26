import { NextResponse } from 'next/server';

// 👇 VACUNA 1: Forzar modo dinámico (Evita ejecución en Build)
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 👇 VACUNA 2: Imports dentro de la función (Lazy Loading)
    const prisma = (await import("@/lib/prisma")).default;
    const easypost = (await import("@/lib/easypost")).default;

    const { packageId } = await req.json();

    // 1. Buscar datos del paquete y usuario
    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
      include: { 
          user: true,
          consolidatedShipment: true 
      }
    });

    if (!pkg) return NextResponse.json({ error: "Paquete no encontrado" }, { status: 404 });

    // 2. Validar que sea un courier de EasyPost
    const courier = pkg.selectedCourier?.toLowerCase() || '';
    if (courier.includes('gasp maker')) {
        return NextResponse.json({ error: "Gasp Maker es envío interno, no requiere EasyPost." }, { status: 400 });
    }

    // =========================================================================
    // 🛑 MODO ESTRICTO NIVEL AMAZON: SIN DIRECCIÓN EXACTA, SE CANCELA LA COMPRA
    // =========================================================================
    
    // Leemos la dirección del paquete individual O de la consolidación
    const savedAddress = pkg.shippingAddress || pkg.consolidatedShipment?.shippingAddress;
    
    if (!savedAddress) {
        // 🔥 EL SISTEMA SE DETIENE. NO HAY SUPOSICIONES.
        return NextResponse.json({ 
            error: "⚠️ ERROR CRÍTICO: Este paquete no tiene una dirección de entrega asignada por el cliente. Compra bloqueada para evitar envío erróneo." 
        }, { status: 400 });
    }

    let finalName = pkg.user.name || 'Cliente';
    let finalStreet = '';
    let finalCity = '';
    let finalCountry = '';
    let finalZip = '00000';
    let finalPhone = pkg.user.phone || '0000000000';

    // Desglosamos el texto de la dirección (Ej: "Jason | 123 Main St, Miami 33101, US | Tel: 555-1234")
    const segments = savedAddress.split('|').map(s => s.trim());
    
    if (segments.length > 0 && segments[0]) finalName = segments[0]; 
    
    if (segments.length > 1 && segments[1]) {
        const geoParts = segments[1].split(',').map(s => s.trim());
        if (geoParts[0]) finalStreet = geoParts[0]; 
        
        if (geoParts.length > 1 && geoParts[1]) {
            finalCity = geoParts[1].replace(/[0-9]/g, '').trim() || 'City';
            finalZip = geoParts[1].match(/\d+/)?.[0] || '00000';
        }
        
        if (geoParts.length > 2 && geoParts[2]) {
            finalCountry = geoParts[2].substring(0, 2).toUpperCase(); 
        }
    }

    if (segments.length > 2 && segments[2].toLowerCase().includes('tel:')) {
        finalPhone = segments[2].replace(/tel:/i, '').trim() || finalPhone;
    }

    // Validación de seguridad extra
    if (!finalStreet || !finalCountry) {
        return NextResponse.json({ 
            error: "⚠️ ERROR: La dirección guardada está incompleta (falta calle o país). Revisa los datos." 
        }, { status: 400 });
    }

    // =========================================================================

    // 3. Crear el envío en EasyPost (Para comprarlo)
    const shipment = await easypost.Shipment.create({
      to_address: {
        name: finalName,
        street1: finalStreet,
        city: finalCity,
        country: finalCountry,
        zip: finalZip,
        phone: finalPhone
      },
      from_address: {
        company: 'Gasp Maker Cargo',
        street1: '1861 NW 22nd St',
        city: 'Miami',
        state: 'FL',
        zip: '33142',
        country: 'US',
        phone: '7862820763'
      },
      parcel: {
        length: pkg.lengthIn,
        width: pkg.widthIn,
        height: pkg.heightIn,
        weight: pkg.weightLbs * 16 // EasyPost usa onzas
      },
      service: pkg.courierService || 'Standard', 
      carrier: pkg.selectedCourier 
    });

    // 4. COMPRAR LA ETIQUETA
    const selectedRate = shipment.rates.find((r: any) => 
        r.carrier.toLowerCase() === courier && 
        (r.service === pkg.courierService || !pkg.courierService)
    );

    if (!selectedRate) {
        return NextResponse.json({ error: "No se encontró tarifa exacta en EasyPost. Revisa los datos de la caja." }, { status: 400 });
    }

    const boughtShipment = await easypost.Shipment.buy(shipment.id, selectedRate.id);

    // 5. Guardar Tracking y Label en Base de Datos
    await prisma.package.update({
        where: { id: packageId },
        data: {
            status: 'ENVIADO',
            finalTrackingNumber: boughtShipment.tracker.tracking_code, 
            receiptUrl: boughtShipment.postage_label.label_url, 
            shippingLabelUrl: boughtShipment.postage_label.label_url 
        }
    });

    return NextResponse.json({ 
        success: true, 
        tracking: boughtShipment.tracker.tracking_code,
        label: boughtShipment.postage_label.label_url 
    });

  } catch (error: any) {
    console.error("EasyPost Buy Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}