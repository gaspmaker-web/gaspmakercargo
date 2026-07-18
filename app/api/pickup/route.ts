import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';


export async function POST(request: Request) {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const { auth } = await import('@/auth');
    const {
      sendPaymentReceiptEmail,
      sendAdminPaymentAlert,
      sendNotification
    } = await import('@/lib/notifications');

    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { calculateAuraLocalDelivery } = await import('@/lib/aura-engine');

// ==========================================
    // 🛡️ RECÁLCULO DE PRECIO EN EL SERVIDOR
    // ==========================================
    const PICKUP_SERVICE_TYPES = ['SHIPPING', 'DELIVERY'];
    const isPickupService = PICKUP_SERVICE_TYPES.includes((body.serviceType || '').toUpperCase());

    let subtotal = 0;
    let processingFee = 0;
    let totalPaid = 0;

    if (isPickupService) {
        const { getProcessingFee } = await import('@/lib/stripeCalc');

        const wLbs     = parseFloat(body.weightLbs) || 0;
        const dMiles   = parseFloat(body.distanceMiles) || 0;
        const vehicle  = (body.heavyVehicle || 'CARGO_VAN').toUpperCase();
        const pCount   = parseInt(body.palletCount) || 1;
        const palletMode = Boolean(body.isPalletMode);

        if (palletMode) {
            // 🔒 Lógica pallet — igual que frontend y charge/route.ts
            if (vehicle === 'BOX_TRUCK') {
                subtotal = 175;
            } else {
                subtotal = pCount === 2 ? 125 : 95;
            }
            if (dMiles > 10) {
                const rate = vehicle === 'BOX_TRUCK' ? 2.50 : 1.75;
                subtotal += parseFloat(((dMiles - 10) * rate).toFixed(2));
            }
        } else if (wLbs > 0) {
            // 🔒 Aura Engine — modo SIMULACIÓN (0-150 lbs)
            const aura = calculateAuraLocalDelivery(
                [{ length: 1, width: 1, height: 1, realWeight: wLbs }],
                dMiles
            );
            subtotal = aura.totalFare;
        } else {
            return NextResponse.json({ message: 'Peso inválido' }, { status: 400 });
        }

        processingFee = getProcessingFee(subtotal);
        totalPaid = parseFloat((subtotal + processingFee).toFixed(2));

    } else {
        // PICKUP_WAREHOUSE — handling fee del inventario real en BD, no hay riesgo
        subtotal      = parseFloat(body.subtotal) || 0;
        processingFee = parseFloat(body.processingFee) || 0;
        totalPaid     = parseFloat(body.totalPaid) || 0;
    }
    // ==========================================
    // ✅ Guardar en BD con precios del SERVIDOR
    // ==========================================
    const newRequest = await prisma.pickupRequest.create({
      data: {
        userId: session.user.id,
        serviceType: body.serviceType || 'SHIPPING',
        originAddress: body.originAddress,
        originCity: body.originCity,
        pickupDate: new Date(body.pickupDate),
        description: body.description,
        contactPhone: body.contactPhone,
        dropOffAddress: body.dropOffAddress || null,
        dropOffCity: body.dropOffCity || null,
        dropOffContact: body.dropOffContact || null,
        dropOffPhone: body.dropOffPhone || null,
        weightInfo: body.weightInfo || body.weightTier,
        volumeInfo: body.volumeInfo || body.volumeTier,
        status: body.status || 'PENDIENTE',
        totalPaid,        // ✅ precio del servidor
        subtotal,         // ✅ precio del servidor
        processingFee,    // ✅ precio del servidor
        stripePaymentId: body.stripePaymentId || null
      },
    });

    // ==========================================
    // 📧 NOTIFICACIONES (sin cambios)
    // ==========================================
    if (body.status === 'PAGADO' && session.user.email) {

      const emailResult = await sendPaymentReceiptEmail(
        session.user.email,
        session.user.name || 'Cliente',
        `Pickup: ${body.serviceType}`,
        totalPaid,  // ✅ precio del servidor
        newRequest.id,
        `Ruta: ${body.originAddress} -> ${body.dropOffAddress || 'Almacén GMC'}`
      );

      await sendAdminPaymentAlert(
        session.user.name || 'Cliente',
        totalPaid,  // ✅ precio del servidor
        `Solicitud Pickup (${body.serviceType})`,
        newRequest.id
      );

      const formattedDate = new Date(body.pickupDate).toLocaleDateString();
      await sendNotification({
        userId: session.user.id,
        title: JSON.stringify({ key: "pickupConfirmedTitle" }),
        message: JSON.stringify({ key: "pickupConfirmedBody", date: formattedDate }),
        type: "SUCCESS"
      });

      if ((emailResult as any)?.error) {
        console.error("❌ ERROR RESEND:", (emailResult as any).error);
      }
    }

    return NextResponse.json(
      { success: true, message: 'Solicitud creada', data: newRequest },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error API Pickup:", error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}