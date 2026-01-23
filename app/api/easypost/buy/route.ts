import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import easypost from '@/lib/easypost';

export async function POST(req: Request) {
  try {
    const { packageId } = await req.json();

    // 1. Buscar datos del paquete y usuario
    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
      include: { user: true }
    });

    if (!pkg) return NextResponse.json({ error: "Paquete no encontrado" }, { status: 404 });

    // 2. Validar que sea un courier de EasyPost
    const courier = pkg.selectedCourier?.toLowerCase() || '';
    if (courier.includes('gasp maker')) {
        return NextResponse.json({ error: "Gasp Maker es envío interno, no requiere EasyPost." }, { status: 400 });
    }

    // 3. Crear el envío en EasyPost (Para comprarlo)
    // Recreamos el objeto porque las cotizaciones caducan
    const shipment = await easypost.Shipment.create({
      to_address: {
        name: pkg.user.name,
        street1: pkg.user.address,
        city: pkg.user.cityZip?.split(' ')[0] || 'City', // Lógica simple, ideal mejorar
        country: pkg.user.countryCode || 'TT',
        zip: pkg.user.cityZip?.match(/\d+/)?.[0] || '00000',
        phone: pkg.user.phone || '5555555555'
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
      service: pkg.courierService || 'Standard', // Usamos el servicio que eligió el cliente
      carrier: pkg.selectedCourier // 'FedEx', 'UPS', etc.
    });

    // 4. COMPRAR LA ETIQUETA (Aquí gastamos dinero real)
    // EasyPost requiere seleccionar la tarifa específica (rate id)
    const selectedRate = shipment.rates.find((r: any) => 
        r.carrier.toLowerCase() === courier && 
        (r.service === pkg.courierService || !pkg.courierService)
    );

    if (!selectedRate) {
        // Fallback: Si no hay tarifa exacta, devolvemos error (Más seguro)
        // Eliminada la línea conflictiva 'shipment.buy' que causaba el error de compilación
        return NextResponse.json({ error: "No se encontró tarifa exacta. Revisa los datos." }, { status: 400 });
    }

    // Usamos el método estático correcto para comprar
    const boughtShipment = await easypost.Shipment.buy(shipment.id, selectedRate.id);

    // 5. Guardar Tracking y Label en Base de Datos
    await prisma.package.update({
        where: { id: packageId },
        data: {
            status: 'ENVIADO',
            gmcTrackingNumber: boughtShipment.tracker.tracking_code, // Tracking Real
            receiptUrl: boughtShipment.postage_label.label_url // PDF de la etiqueta
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