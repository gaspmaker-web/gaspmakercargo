import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const { auth } = await import('@/auth');
    // 🔥 USANDO TU PROPIA LIBRERÍA DE EASYPOST
    const easypost = (await import("@/lib/easypost")).default;

    // 1. Verificación de Seguridad
    const session = await auth();
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE')) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();

    // 2. 🕵️‍♂️ LÓGICA DE CLIENTE FANTASMA
    let user = await prisma.user.findUnique({
      where: { email: body.senderEmail }
    });

    if (!user) {
      console.log(`Creando nueva cuenta Drop&Go para: ${body.senderEmail}`);
      const randomSuite = `GMC-${Math.floor(1000 + Math.random() * 9000)}`;
      
      user = await prisma.user.create({
        data: {
          name: body.senderName,
          email: body.senderEmail,
          phone: body.senderPhone,
          role: 'CLIENT',
          suiteNo: randomSuite,
          countryCode: body.receiverCountry || 'US'
        }
      });
    }

    // Tracking interno base (por si EasyPost falla o no se usa)
    let gmcTracking = `GMC${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 100)}`;
    const fullDestination = `${body.receiverName} | ${body.receiverAddress}, ${body.receiverCity}, ${body.receiverState} ${body.receiverZip}, ${body.receiverCountry}`;

    // 🔥 3. COMPRAR EL LABEL OFICIAL EN EASYPOST 🔥
    let labelUrl = null;
    let finalTracking = gmcTracking;

    if (body.shipmentId && body.rateId) {
      try {
        console.log(`Comprando label en EasyPost para Shipment: ${body.shipmentId} con Tarifa: ${body.rateId}`);
        
        // Efectuamos la compra directa
        const boughtShipment = await easypost.Shipment.buy(body.shipmentId, body.rateId);
        
        // Extraemos URL del PDF
        if (boughtShipment.postage_label && boughtShipment.postage_label.label_url) {
            labelUrl = boughtShipment.postage_label.label_url;
        }
        
        // Extraemos el Tracking oficial
        if (boughtShipment.tracker && boughtShipment.tracker.tracking_code) {
            finalTracking = boughtShipment.tracker.tracking_code; 
        } else if (boughtShipment.tracking_code) {
            finalTracking = boughtShipment.tracking_code;
        }
      } catch (epError: any) {
        console.error("🔥 Error comprando label en EasyPost:", epError.message || epError);
        // Si falla por saldo, sigue adelante y guarda con el código GMC
      }
    }

    // 4. 📦 GUARDAR PAQUETE Y PAGOS EN LA BASE DE DATOS
    const newPackage = await prisma.package.create({
      data: {
        userId: user.id,
        gmcTrackingNumber: gmcTracking, // El interno de ustedes
        carrierTrackingNumber: finalTracking, // El real (1Z...)
        finalTrackingNumber: finalTracking,   
        description: `${body.description} [DROP & GO]`,
        
        weightLbs: parseFloat(body.weight),
        lengthIn: body.length ? parseFloat(body.length) : 0,
        widthIn: body.width ? parseFloat(body.width) : 0,
        heightIn: body.height ? parseFloat(body.height) : 0,
        declaredValue: body.declaredValue ? parseFloat(body.declaredValue) : 0,
        
        shippingAddress: fullDestination,
        courier: body.courier,
        selectedCourier: body.courier,
        courierService: body.service,
        
        photoUrlMiami: body.photoUrl,
        shippingLabelUrl: labelUrl, // Guardamos el Link PDF
        status: 'EN_ALMACEN', // Porque ya lo tienes en el mostrador
        
        // Pagos consolidados (Flete + Processing Fee + Seguro)
        shippingSubtotal: parseFloat(body.subtotal || body.price),
        shippingProcessingFee: parseFloat(body.processingFee || 0), // Aquí va Stripe + Seguro
        shippingTotalPaid: parseFloat(body.price),
        stripePaymentId: `SQUARE_POS_${body.paymentMethod}_${Date.now()}`
      }
    });

    // 5. RESPONDER AL FRONTEND
    return NextResponse.json({
      success: true,
      tracking: finalTracking, // Mostramos el oficial al cliente
      labelUrl: labelUrl, // Activamos el botón oscuro
      clientName: user.name,
      email: user.email,
      totalPaid: body.price,
      paymentMethod: body.paymentMethod === 'CARD' ? 'Tarjeta (Square)' : 'Efectivo',
      packageId: newPackage.id
    }, { status: 200 });

  } catch (error: any) {
    console.error("🔥 Error crítico en Pay & Go:", error);
    return NextResponse.json({ message: "Error procesando en base de datos.", error: error.message }, { status: 500 });
  }
}