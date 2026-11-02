import { NextResponse } from "next/server";
import { getMobileUser } from "@/lib/getMobileUser";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;
    const { stripe } = await import("@/lib/stripe");

    const session = await auth();
    const mobileUser = await getMobileUser(req);
    const userId = session?.user?.id || mobileUser?.id;
    if (!userId) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const { cardId } = await req.json();
    if (!cardId) return NextResponse.json({ message: "cardId requerido" }, { status: 400 });

    // Verificar que la tarjeta pertenece al usuario
    const card = await prisma.paymentMethod.findUnique({ where: { id: cardId } });
    if (!card || card.userId !== userId) {
      return NextResponse.json({ message: "Tarjeta no encontrada" }, { status: 404 });
    }

    // Quitar default a todas las tarjetas del usuario
    await prisma.paymentMethod.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    // Marcar esta como default
    await prisma.paymentMethod.update({
      where: { id: cardId },
      data: { isDefault: true },
    });

    // Actualizar en Stripe también
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.stripeCustomerId) {
      await stripe.customers.update(user.stripeCustomerId, {
        invoice_settings: { default_payment_method: card.stripePaymentMethodId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error set-default card:", error);
    return NextResponse.json({ message: "Error al actualizar" }, { status: 500 });
  }
}
