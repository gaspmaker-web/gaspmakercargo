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
    const { subscriptionId, userId, suiteNo, isPrimary, recipientId } = body;

    if (!suiteNo) {
        return NextResponse.json({ error: 'Falta el número de PMB' }, { status: 400 });
    }

    // LÓGICA 1: TITULAR PRINCIPAL
    if (isPrimary) {
        if (!subscriptionId || !userId) {
            return NextResponse.json({ error: 'Faltan datos (ID o Usuario)' }, { status: 400 });
        }

        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { suiteNo: suiteNo } // Guarda el número de PMB puro (ej: 76826)
            }),
            prisma.mailboxSubscription.update({
                where: { id: subscriptionId },
                data: { status: 'ACTIVE', rejectionReason: null }
            }),
            // 🔥 NUEVO: Notificamos al cliente en su panel (MÉTODO ENTERPRISE MULTILINGÜE)
            prisma.notification.create({
                data: {
                    userId: userId,
                    title: "mailboxApprovedTitle", // 🔑 Clave del diccionario
                    message: JSON.stringify({ 
                        key: "mailboxApprovedDesc", 
                        suite: suiteNo 
                    }), // 🔑 JSON con clave y variable
                    type: "INFO",
                    href: "/dashboard-cliente/buzon" // ✅ Ruta correcta
                }
            })
        ]);

        return NextResponse.json({ success: true, message: 'Buzón activado y PMB asignado.' });
    } 
    
    // LÓGICA 2: PERSONA ADICIONAL
    else {
        if (!recipientId || !userId) {
            return NextResponse.json({ error: 'Falta ID de usuario o destinatario' }, { status: 400 });
        }

        // Activamos al adicional Y nos aseguramos de que la cuenta principal 
        // mantenga el mismo número de PMB confirmado.
        await prisma.$transaction([
            prisma.additionalRecipient.update({
                where: { id: recipientId },
                data: { status: 'ACTIVE', rejectionReason: null }
            }),
            prisma.user.update({
                where: { id: userId },
                data: { suiteNo: suiteNo } 
            }),
            // 🔥 NUEVO: Notificamos al titular sobre la aprobación de su persona adicional (MÉTODO ENTERPRISE MULTILINGÜE)
            prisma.notification.create({
                data: {
                    userId: userId,
                    title: "additionalApprovedTitle", // 🔑 Clave del diccionario
                    message: JSON.stringify({ 
                        key: "additionalApprovedDesc", 
                        suite: suiteNo 
                    }), // 🔑 JSON con clave y variable
                    type: "INFO",
                    href: "/dashboard-cliente/buzon" // ✅ Ruta correcta
                }
            })
        ]);

        return NextResponse.json({ success: true, message: 'Persona adicional aprobada y PMB confirmado.' });
    }

  } catch (error) {
    console.error("Error aprobando KYC:", error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}