import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

async function getUserFromToken(req: Request) {
  const { jwtVerify } = await import("jose");
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "secret");
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as any;
  } catch { return null; }
}

export async function POST(req: Request) {
  try {
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;

    const session = await auth();
    const mobileUser = !session?.user?.id ? await getUserFromToken(req) : null;
    if (!session?.user?.id && !mobileUser?.id) {
      return NextResponse.json({ message: "No autorizado." }, { status: 401 });
    }
    const userId = session?.user?.id || mobileUser?.id;

    const { consolidationId, carrier, service, price } = await req.json();

    if (!consolidationId || !carrier || !service || !price) {
      return NextResponse.json({ message: "Missing fields." }, { status: 400 });
    }

    const consolidation = await prisma.consolidatedShipment.findFirst({
      where: { id: consolidationId, userId }
    });
    if (!consolidation) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }

    const updated = await prisma.consolidatedShipment.update({
      where: { id: consolidationId },
      data: {
             selectedCourier: carrier,
        courierService: service,
        totalAmount: parseFloat(price),
        ...(consolidation.status !== 'PAGADO' ? { status: 'PENDIENTE_PAGO' } : {}),
      }
    });

    return NextResponse.json({ success: true, totalAmount: updated.totalAmount });
  } catch (error: any) {
    console.error("Error selecting rate:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
