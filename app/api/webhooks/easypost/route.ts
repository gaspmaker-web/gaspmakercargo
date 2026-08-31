import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ==========================================
// 🔥 EASYPOST WEBHOOK — Tracking automático
// Configura en: https://www.easypost.com/account/webhooks
// URL: https://tudominio.com/api/webhooks/easypost
// ==========================================

// Mapa de estados EasyPost → estados GMC
const STATUS_MAP: Record<string, string> = {
    'in_transit':       'EN_TRANSITO',
    'out_for_delivery': 'EN_REPARTO',   // ← Pasa automáticamente a reparto
    'delivered':        'ENTREGADO',
    'available_for_pickup': 'EN_REPARTO',
    'return_to_sender': 'DEVUELTO',
    'failure':          'FALLIDO',
};

export async function POST(req: Request) {
    try {
        const prisma = (await import("@/lib/prisma")).default;
        const { sendNotification } = await import("@/lib/notifications");

        // 🔐 Verificar webhook secret de EasyPost
        const webhookSecret = process.env.easypost_webhook_secret;
        if (webhookSecret) {
            const signature = req.headers.get('x-hmac-signature') || req.headers.get('x-hmac-signature-256');
            if (!signature) {
                return NextResponse.json({ error: 'No signature' }, { status: 401 });
            }
            // Verificación HMAC
            const body = await req.text();
            const crypto = await import('crypto');
            const expectedSig = crypto
                .createHmac('sha256', webhookSecret)
                .update(body)
                .digest('hex');
            if (`hmac-sha256-hex=${expectedSig}` !== signature) {
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }
            const event = JSON.parse(body);
            return await processEvent(event, prisma, sendNotification);
        }

        // Sin secret — desarrollo/testing
        const event = await req.json();
        return await processEvent(event, prisma, sendNotification);

    } catch (error: any) {
        console.error('EasyPost webhook error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function processEvent(event: any, prisma: any, sendNotification: any) {
    const eventType = event.description || event.type || '';
    const tracker = event.result;

    if (!tracker || !eventType.includes('tracker')) {
        return NextResponse.json({ received: true, skipped: true });
    }

    const trackerId = tracker.id;
    const epStatus = tracker.status; // in_transit, out_for_delivery, delivered, etc.
    const trackingCode = tracker.tracking_code;

    console.log(`📦 EasyPost webhook: ${eventType} | status: ${epStatus} | tracker: ${trackerId}`);

    const newStatus = STATUS_MAP[epStatus];
    if (!newStatus) {
        console.log(`⏭ Status "${epStatus}" no mapeado — ignorando`);
        return NextResponse.json({ received: true, skipped: true });
    }

    // Buscar paquete por easypostTrackerId o finalTrackingNumber
    const pkg = await prisma.package.findFirst({
        where: {
            OR: [
                { easypostTrackerId: trackerId },
                { finalTrackingNumber: trackingCode },
                { carrierTrackingNumber: trackingCode },
            ]
        },
        include: { user: true, consolidatedShipment: true }
    });

    if (!pkg) {
        console.warn(`⚠️ Paquete no encontrado para tracker: ${trackerId} / ${trackingCode}`);
        return NextResponse.json({ received: true, notFound: true });
    }

    // Solo avanzar — nunca retroceder de estado
    const STATUS_ORDER = ['EN_ALMACEN', 'LISTO_PARA_ENVIO', 'ENVIADO', 'EN_TRANSITO', 'EN_REPARTO', 'ENTREGADO'];
    const currentIdx = STATUS_ORDER.indexOf(pkg.status);
    const newIdx = STATUS_ORDER.indexOf(newStatus);
    if (newIdx <= currentIdx) {
        console.log(`⏭ Status actual "${pkg.status}" ya es igual o mayor — ignorando`);
        return NextResponse.json({ received: true, skipped: true });
    }

    // Actualizar Package
    await prisma.package.update({
        where: { id: pkg.id },
        data: { status: newStatus }
    });

    // Propagar a ConsolidatedShipment si existe
    if (pkg.consolidatedShipmentId) {
        await prisma.consolidatedShipment.update({
            where: { id: pkg.consolidatedShipmentId },
            data: { status: newStatus }
        });
    }

    console.log(`✅ ${pkg.gmcTrackingNumber} → ${newStatus}`);

    // Notificar al cliente en eventos importantes
    if (['EN_REPARTO', 'ENTREGADO'].includes(newStatus) && pkg.user) {
        const messages: Record<string, { title: string; message: string }> = {
            EN_REPARTO: {
                title: '📦 ¡Tu paquete está en camino!',
                message: `Tu paquete ${pkg.gmcTrackingNumber} está out for delivery y llegará hoy.`,
            },
            ENTREGADO: {
                title: '✅ ¡Paquete Entregado!',
                message: `Tu paquete ${pkg.gmcTrackingNumber} fue entregado exitosamente.`,
            },
        };
        const notif = messages[newStatus];
        if (notif) {
            await sendNotification({
                userId: pkg.user.id,
                title: notif.title,
                message: notif.message,
                type: newStatus === 'ENTREGADO' ? 'SUCCESS' : 'INFO',
                href: `/dashboard-cliente/en-transito`,
            });
        }
    }

    return NextResponse.json({ received: true, updated: pkg.gmcTrackingNumber, newStatus });
}