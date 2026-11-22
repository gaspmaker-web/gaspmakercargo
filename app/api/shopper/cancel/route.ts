import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { orderId, reason } = await req.json();
    if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    const order = await prisma.shopperOrder.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (['PAID', 'PURCHASED', 'SHIPPED', 'DELIVERED'].includes(order.status)) {
      return NextResponse.json({ error: "Cannot cancel an order that has already been paid or shipped" }, { status: 400 });
    }

    await prisma.shopperOrder.update({
      where: { id: orderId },
      data: { status: "CANCELLED", updatedAt: new Date() },
    });

    // Notify client
    try {
      const { sendNotification } = await import('@/lib/notifications');
      const userCountry = `${(order.user as any).countryCode || ''} ${(order.user as any).country || ''}`.toUpperCase();
      let langCode = 'es';
      if (userCountry.includes('US') || userCountry.includes('CA') || userCountry.includes('GB')) langCode = 'en';
      else if (userCountry.includes('BR') || userCountry.includes('BRAZIL')) langCode = 'pt';
      else if (userCountry.includes('FR') || userCountry.includes('HT') || userCountry.includes('HAITI')) langCode = 'fr';

      const shortId = orderId.slice(-6).toUpperCase();
      const reasonText = reason ? ` — ${reason}` : '';

      const messages: Record<string, { title: string; message: string }> = {
        en: { title: '❌ Order Cancelled', message: `Your order #${shortId} has been cancelled${reasonText}. Contact us if you have questions.` },
        es: { title: '❌ Orden Cancelada', message: `Tu orden #${shortId} ha sido cancelada${reasonText}. Contáctanos si tienes preguntas.` },
        pt: { title: '❌ Pedido Cancelado', message: `Seu pedido #${shortId} foi cancelado${reasonText}. Entre em contato se tiver dúvidas.` },
        fr: { title: '❌ Commande Annulée', message: `Votre commande #${shortId} a été annulée${reasonText}. Contactez-nous si vous avez des questions.` },
      };

      const msg = messages[langCode] || messages['es'];
      await sendNotification({
        userId: order.userId,
        title: msg.title,
        message: msg.message,
        href: `/${langCode}/dashboard-cliente/compras`,
        type: 'INFO',
      });
    } catch (notifError) {
      console.error('Error sending cancel notification:', notifError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error cancelling shopper order:', error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}