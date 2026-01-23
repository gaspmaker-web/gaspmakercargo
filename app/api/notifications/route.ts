import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([], { status: 401 });

    // Enterprise Fix: No traemos campos pesados si no se usan
    // Limitamos a 15 para no saturar la red
    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 15, 
      select: {
        id: true,
        title: true,
        message: true,
        isRead: true,
        href: true,
        type: true,
        createdAt: true
      }
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Notification API Error:", error);
    // Retornar array vacío evita que el frontend explote
    return NextResponse.json([], { status: 500 });
  }
}

export async function PATCH() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Update masivo optimizado
    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

// 🔥 NUEVO MÉTODO PARA ELIMINAR
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      // 1. Eliminar una específica (validando que sea del usuario)
      await prisma.notification.deleteMany({
        where: {
          id: id,
          userId: session.user.id 
        }
      });
    } else {
      // 2. Eliminar TODAS (Vaciar bandeja)
      await prisma.notification.deleteMany({
        where: {
          userId: session.user.id
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Notification Error:", error);
    return NextResponse.json({ error: 'Error deleting' }, { status: 500 });
  }
}