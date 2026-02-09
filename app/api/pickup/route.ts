import { NextResponse } from 'next/server';

// 👇 VACUNA 1: Forzar modo dinámico (Para que Vercel ignore esto en el Build)
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 👇 VACUNA 2: Imports dentro de la función (Lazy Loading)
    const prisma = (await import('@/lib/prisma')).default;
    const { auth } = await import('@/auth');
    // 🔥 IMPORTAMOS LAS NUEVAS FUNCIONES DE NOTIFICACIÓN
    const { 
        sendPaymentReceiptEmail, 
        sendAdminPaymentAlert, 
        sendNotification 
    } = await import('@/lib/notifications');

    const session = await auth();
    // 1. Seguridad: Verificar que el usuario esté logueado
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();

    // 2. Guardar en Base de Datos (Esto sigue igual)
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
        totalPaid: body.totalPaid || 0,
        subtotal: body.subtotal || 0,
        processingFee: body.processingFee || 0,
        stripePaymentId: body.stripePaymentId || null
      },
    });

    // 3. --- NOTIFICACIONES Y ALERTAS ---
    if (body.status === 'PAGADO' && session.user.email) {
        
        // A. Email al Cliente (Recibo con detalles de ruta)
        const emailResult = await sendPaymentReceiptEmail(
            session.user.email,
            session.user.name || 'Cliente',
            `Pickup: ${body.serviceType}`,
            body.totalPaid,
            newRequest.id,
            `Ruta: ${body.originAddress} -> ${body.dropOffAddress || 'Almacén GMC'}`
        );

        // B. Alerta al Admin (Para que despaches al chofer)
        await sendAdminPaymentAlert(
            session.user.name || 'Cliente',
            body.totalPaid,
            `Solicitud Pickup (${body.serviceType})`,
            newRequest.id
        );

        // C. Notificación en el Dashboard del Cliente (Campanita)
        await sendNotification({
            userId: session.user.id,
            title: "Pickup Confirmado",
            message: `Tu solicitud de recolección para el ${new Date(body.pickupDate).toLocaleDateString()} ha sido recibida.`,
            type: "SUCCESS"
        });

        // Log para depuración (opcional, respetando tu estilo)
        if ((emailResult as any)?.error) {
            console.error("❌ ERROR RESEND:", (emailResult as any).error);
        }
    }
    // ----------------------------------------------------

    return NextResponse.json({ success: true, message: 'Solicitud creada', data: newRequest }, { status: 201 });

  } catch (error) {
    console.error("Error API Pickup:", error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}