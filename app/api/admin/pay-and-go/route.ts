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

    // 🔥 4.5 ENVIAR CORREO DE RECIBO AL CLIENTE CON RESEND 🔥
    try {
      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        await resend.emails.send({
          from: 'GaspMaker <noreply@gaspmaker.com>', // <-- Cambia el dominio al oficial de tu empresa si es necesario
          to: user.email,
          subject: `📦 Recibo de Envío Pay & Go - Tracking: ${finalTracking}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #1e293b; padding: 24px; text-align: center;">
                <h1 style="color: #ead8b1; margin: 0; font-size: 24px;">Recibo de Envío en Mostrador</h1>
              </div>
              <div style="padding: 24px; color: #374151;">
                <p style="font-size: 16px;">Hola <strong>${user.name}</strong>,</p>
                <p>Tu paquete ha sido procesado exitosamente en nuestra sucursal y el pago ha sido recibido.</p>
                
                <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 24px 0; border: 1px solid #e2e8f0;">
                  <h3 style="margin-top: 0; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">Detalles del Envío</h3>
                  <p style="margin: 8px 0;"><strong>Tracking Oficial:</strong> <span style="color: #2563eb; font-weight: bold;">${finalTracking}</span></p>
                  <p style="margin: 8px 0;"><strong>Destinatario:</strong> ${body.receiverName}</p>
                  <p style="margin: 8px 0;"><strong>Destino:</strong> ${body.receiverCity}, ${body.receiverCountry}</p>
                  <p style="margin: 8px 0;"><strong>Courier:</strong> ${body.courier} - ${body.service}</p>
                  <p style="margin: 8px 0;"><strong>Contenido:</strong> ${body.description}</p>
                </div>

                <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 24px 0; border: 1px solid #e2e8f0;">
                  <h3 style="margin-top: 0; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">Detalles del Pago</h3>
                  <p style="margin: 8px 0;"><strong>Total Pagado:</strong> <span style="font-size: 18px; font-weight: bold; color: #16a34a;">$${parseFloat(body.price).toFixed(2)}</span></p>
                  <p style="margin: 8px 0;"><strong>Método:</strong> ${body.paymentMethod === 'CARD' ? 'Tarjeta (POS)' : 'Efectivo'}</p>
                </div>

                <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 32px;">
                  Gracias por confiar en <strong>GaspMaker</strong>.<br>
                  Puedes hacer seguimiento a tu paquete en cualquier momento utilizando tu número de tracking.
                </p>
              </div>
            </div>
          `
        });
        console.log(`✉️ Email de recibo enviado exitosamente a: ${user.email}`);
      } else {
        console.warn("⚠️ RESEND_API_KEY no está configurado. No se envió el correo.");
      }
    } catch (emailError) {
      console.error("🔥 Error enviando el email con Resend:", emailError);
      // No lanzamos el error para que la transacción del cajero siga siendo exitosa
    }

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