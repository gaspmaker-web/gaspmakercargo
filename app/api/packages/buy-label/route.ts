import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import easypost from '@/lib/easypost';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const { packageId } = await req.json();

    // 1. Buscar datos del paquete y usuario
    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
      include: { user: true }
    });

    if (!pkg) return NextResponse.json({ error: "Paquete no encontrado" }, { status: 404 });

    // 2. Validaciones
    if (!pkg.selectedCourier) return NextResponse.json({ error: "El paquete no tiene courier asignado." }, { status: 400 });
    
    // Si es Gasp Maker, no se debe usar esta API (para eso es el botón verde)
    if (pkg.selectedCourier.toUpperCase().includes('GASP')) {
        return NextResponse.json({ error: "Para Gasp Maker usa el despacho manual." }, { status: 400 });
    }

    // 3. Crear el objeto de Envío en EasyPost (Para comprarlo)
    const shipment = await easypost.Shipment.create({
      to_address: {
        name: pkg.user.name,
        street1: pkg.user.address,
        city: pkg.user.cityZip?.split(' ')[0] || 'City', 
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
        weight: (pkg.weightLbs || 1) * 16 // EasyPost usa onzas
      },
      // Intentamos forzar el carrier que eligió el cliente
      // (Nota: EasyPost a veces recalcula, pero intentaremos filtrar)
    });

    // 4. Buscar la tarifa específica que coincida con lo que el cliente pagó
    if (!shipment.rates) throw new Error("No se generaron tarifas en EasyPost.");

    // Filtramos la tarifa correcta (Ej: Que sea FedEx y sea Priority)
    const selectedRate = shipment.rates.find((r: any) => {
        const rateCarrier = r.carrier.toUpperCase();
        const pkgCourier = pkg.selectedCourier?.toUpperCase() || '';
        
        // Coincidencia de nombre (Ej: FEDEX vs FedEx)
        return rateCarrier.includes(pkgCourier) || pkgCourier.includes(rateCarrier);
    });

    // Si no encontramos la exacta, tomamos la más barata de ESE courier
    const rateToBuy = selectedRate || shipment.rates.find((r: any) => r.carrier.toUpperCase().includes(pkg.selectedCourier?.toUpperCase()));

    if (!rateToBuy) {
        return NextResponse.json({ error: `No se encontró tarifa disponible para ${pkg.selectedCourier} en EasyPost.` }, { status: 400 });
    }

    // 5. COMPRAR LA ETIQUETA 💸
    const boughtShipment = await easypost.Shipment.buy(shipment.id, rateToBuy.id);

    // 6. Guardar Tracking y Label en Base de Datos
    await prisma.package.update({
        where: { id: packageId },
        data: {
            status: 'ENVIADO',
            finalTrackingNumber: boughtShipment.tracker.tracking_code, // Tracking Real de salida
            receiptUrl: boughtShipment.postage_label.label_url // Guardamos el PDF aquí
        }
    });

    return NextResponse.json({ 
        success: true, 
        tracking: boughtShipment.tracker.tracking_code,
        label: boughtShipment.postage_label.label_url 
    });

  } catch (error: any) {
    console.error("EasyPost Buy Error:", error);
    return NextResponse.json({ error: error.message || "Error conectando con EasyPost" }, { status: 500 });
  }
}