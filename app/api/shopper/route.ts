import { NextResponse } from "next/server"; // 🔥 ESTA ES LA LÍNEA QUE FALTABA
import { auth } from "@/auth"; 
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const orders = await prisma.shopperOrder.findMany({
      where: { userId: session.user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" }
    });

    const savedCards = await prisma.paymentMethod.findMany({
      where: { userId: session.user.id }
    });

    return NextResponse.json({ orders, savedCards }); 
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener órdenes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { items, itemsSubtotal } = body;

    const newOrder = await prisma.shopperOrder.create({
      data: {
        userId: session.user.id,
        status: "PENDING_QUOTE",
        itemsSubtotal: itemsSubtotal,
        items: {
          create: items.map((item: any) => ({
            productUrl: item.url,
            details: item.details || "",
            quantity: item.quantity,
            declaredPrice: item.price,
          })),
        },
      },
    });

    return NextResponse.json({ success: true, orderId: newOrder.id }, { status: 200 });

  } catch (error) {
    console.error("Error creando orden Shopper:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}