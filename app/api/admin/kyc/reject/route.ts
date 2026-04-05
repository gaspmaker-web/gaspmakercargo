import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { subscriptionId, reason, isPrimary, recipientId } = body;

    if (!reason) {
      return NextResponse.json({ error: 'Razón de rechazo requerida' }, { status: 400 });
    }

    // LÓGICA 1: SI RECHAZAMOS AL TITULAR
    if (isPrimary) {
        if (!subscriptionId) return NextResponse.json({ error: 'Falta ID de suscripción' }, { status: 400 });

        // Actualizamos y guardamos el resultado en la variable "sub" para saber a quién notificar
        const sub = await prisma.mailboxSubscription.update({
            where: { id: subscriptionId },
            data: { status: 'REJECTED', rejectionReason: reason }
        });

        // 🔥 Notificamos al cliente sobre el rechazo (MÉTODO ENTERPRISE MULTILINGÜE)
        await prisma.notification.create({
            data: {
                userId: sub.userId,
                title: "mailboxRejectedTitle", // 🔑 Clave del diccionario
                message: JSON.stringify({ 
                    key: "mailboxRejectedDesc", 
                    reason: reason 
                }), // 🔑 JSON con la clave y la variable
                type: "ALERT",
                href: "/dashboard-cliente/buzon" // ✅ Ruta correcta 
            }
        });
    } 
    // LÓGICA 2: SI RECHAZAMOS A UN ADICIONAL
    else {
        if (!recipientId) return NextResponse.json({ error: 'Falta ID de persona adicional' }, { status: 400 });

        // Actualizamos e incluimos la suscripción madre para saber a qué titular avisarle
        const rec = await prisma.additionalRecipient.update({
            where: { id: recipientId },
            data: { status: 'REJECTED', rejectionReason: reason },
            include: { subscription: true }
        });

        // 🔥 Notificamos al titular que su adicional tuvo un problema (MÉTODO ENTERPRISE MULTILINGÜE)
        await prisma.notification.create({
            data: {
                userId: rec.subscription.userId,
                title: "additionalRejectedTitle", // 🔑 Clave del diccionario
                message: JSON.stringify({ 
                    key: "additionalRejectedDesc", 
                    name: rec.fullName,
                    reason: reason 
                }), // 🔑 JSON con la clave y las variables
                type: "ALERT",
                href: "/dashboard-cliente/buzon" // ✅ Ruta correcta 
            }
        });
    }

    return NextResponse.json({ success: true, message: 'Documentos rechazados y cliente notificado.' });

  } catch (error) {
    console.error("Error rechazando KYC:", error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}