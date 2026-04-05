import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return new NextResponse("Status is required", { status: 400 });
    }

    // 1. Actualizamos el estado general de la cita (PENDING -> READY -> COMPLETED)
    const updatedRequest = await prisma.mailPickupRequest.update({
      where: { id: params.id },
      data: { 
        status,
        completedAt: status === "COMPLETED" ? new Date() : null 
      },
      include: {
        mailItems: true // Traemos los items para actualizarlos si es necesario
      }
    });

    // 2. Lógica Enterprise: Si el Admin confirma la entrega física, marcamos los sobres como ENTREGADOS
    if (status === "COMPLETED" && updatedRequest.mailItems.length > 0) {
      const mailItemIds = updatedRequest.mailItems.map(item => item.id);
      
      await prisma.mailItem.updateMany({
        where: { id: { in: mailItemIds } },
        data: { status: "DELIVERED_PHYSICAL" }
      });
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("[MAILBOX_PICKUP_STATUS_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}