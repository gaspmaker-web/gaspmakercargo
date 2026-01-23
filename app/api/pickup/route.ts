import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { sendPaymentReceiptEmail } from '@/lib/notifications';

export async function POST(request: Request) {
  try {
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

    // 3. --- ENVIAR NOTIFICACIÓN CON DEBUGGING ---
    if (body.status === 'PAGADO' && session.user.email) {
        console.log(`📨 Intentando enviar email a: ${session.user.email}...`);
        
        const result = await sendPaymentReceiptEmail(
            session.user.email,
            session.user.name || 'Cliente',
            body.serviceType,
            body.totalPaid,
            newRequest.id,
            `${body.originAddress} -> ${body.dropOffAddress || 'Almacén GMC'}`
        );

        // Ahora sí imprimimos el resultado real
        // 🚨 CORRECCIÓN: Usamos (result as any) para que TypeScript no bloquee el Build
        if (result?.error) {
            console.error("❌ ERROR RESEND:", result.error);
        } else {
            console.log("✅ ÉXITO RESEND. ID:", (result as any)?.data?.id);
        }
    }
    // ----------------------------------------------------

    return NextResponse.json({ success: true, message: 'Solicitud creada', data: newRequest }, { status: 201 });

  } catch (error) {
    console.error("Error API Pickup:", error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}