import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { mailItemIds, scheduledDate, scheduledTime } = body;

    if (!mailItemIds || mailItemIds.length === 0) {
      return new NextResponse("No items selected", { status: 400 });
    }

    // 1. Creamos la solicitud de Recogida y conectamos los sobres (MailItems)
    const pickupRequest = await prisma.mailPickupRequest.create({
      data: {
        userId: session.user.id,
        scheduledDate: new Date(scheduledDate),
        scheduledTime: scheduledTime,
        status: "PENDING",
        mailItems: {
          connect: mailItemIds.map((id: string) => ({ id })),
        },
      },
    });

    // 2. Actualizamos el estado de los sobres para que no sigan apareciendo como "Disponibles"
    await prisma.mailItem.updateMany({
      where: {
        id: { in: mailItemIds },
      },
      data: {
        status: "PICKUP_SCHEDULED",
      },
    });

    return NextResponse.json(pickupRequest);
  } catch (error) {
    console.error("[MAILBOX_PICKUP_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}