import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// GET: Listar tarjetas guardadas
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

  const cards = await prisma.paymentMethod.findMany({
    where: { userId: session.user.id },
    orderBy: { isDefault: 'desc' } // Muestra la predeterminada primero
  });

  return NextResponse.json({ cards });
}

// POST: Guardar referencia de tarjeta nueva
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const { paymentMethodId } = await req.json();

    // 1. Recuperar detalles de la tarjeta desde Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    if (!paymentMethod || !paymentMethod.card) {
        throw new Error("Método de pago inválido");
    }

    // 2. Verificar si es la primera tarjeta (para hacerla default)
    const count = await prisma.paymentMethod.count({ where: { userId: session.user.id } });
    const isFirst = count === 0;

    // 3. Guardar en Base de Datos
    const newCard = await prisma.paymentMethod.create({
        data: {
            userId: session.user.id,
            stripePaymentMethodId: paymentMethod.id,
            brand: paymentMethod.card.brand,
            last4: paymentMethod.card.last4,
            expMonth: paymentMethod.card.exp_month,
            expYear: paymentMethod.card.exp_year,
            isDefault: isFirst, // Si es la primera, es default
            isBackup: false
        }
    });

    // Opcional: Si es default, marcarla como default en el Customer de Stripe también
    if (isFirst) {
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (user?.stripeCustomerId) {
            await stripe.customers.update(user.stripeCustomerId, {
                invoice_settings: { default_payment_method: paymentMethod.id }
            });
        }
    }

    return NextResponse.json({ success: true, card: newCard });

  } catch (error: any) {
    console.error("Error saving card:", error);
    return NextResponse.json({ message: "Error al guardar tarjeta" }, { status: 500 });
  }
}

// DELETE: Borrar tarjeta
export async function DELETE(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ status: 401 });

    const { cardId } = await req.json();

    // Buscar tarjeta en BD
    const card = await prisma.paymentMethod.findUnique({ where: { id: cardId } });
    if (!card) return NextResponse.json({ message: "Tarjeta no encontrada" }, { status: 404 });

    // Desvincular de Stripe
    try {
        await stripe.paymentMethods.detach(card.stripePaymentMethodId);
    } catch (e) {
        console.error("Error Stripe detach (puede que ya no exista):", e);
    }

    // Borrar de BD
    await prisma.paymentMethod.delete({ where: { id: cardId } });

    return NextResponse.json({ success: true });
}