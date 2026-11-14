import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { jwtVerify } from "jose";

async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'secret');
    try { const { payload } = await jwtVerify(token, secret); return { id: (payload as any).id } as any; }
    catch { return null; }
  }
  const session = await auth();
  return session?.user ?? null;
}

export async function POST(req: Request) {
  try {
    const sessionUser = await getUserFromRequest(req);
    if (!sessionUser?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
// 🏢 Tenant filter
const { getTenant } = await import('@/lib/tenant');
const tenant = await getTenant();
    const body = await req.json();
    const { mailItemIds, scheduledDate, scheduledTime } = body;

    if (!mailItemIds || mailItemIds.length === 0) {
      return new NextResponse("No items selected", { status: 400 });
    }

    // 1. Creamos la solicitud de Recogida y conectamos los sobres (MailItems)
    const pickupRequest = await prisma.mailPickupRequest.create({
      data: {
        userId: sessionUser.id,
        tenant_id: tenant?.id || null,  // ← AÑADIR
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