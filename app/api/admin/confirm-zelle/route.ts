import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;

    const session = await auth();
    if (!session?.user || (session.user.role !== 'ADMIN')) {
      return NextResponse.json({ message: "No autorizado." }, { status: 401 });
    }

    const { consolidationId } = await req.json();

    const consolidation = await prisma.consolidatedShipment.findUnique({
      where: { id: consolidationId },
      include: { user: true }
    });

    if (!consolidation) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (consolidation.status !== 'PENDIENTE_ZELLE') return NextResponse.json({ error: "Not a Zelle payment" }, { status: 400 });

    // Confirmar pago
    await prisma.consolidatedShipment.update({
      where: { id: consolidationId },
      data: { status: 'PAGADO' }
    });

    // Notificar al cliente
    await prisma.notification.create({
      data: {
        userId: consolidation.userId,
        title: '✅ Zelle Payment Confirmed',
        message: `Your Zelle payment of $${consolidation.totalAmount?.toFixed(2)} has been confirmed.`,
        type: 'INFO',
        href: '/dashboard-cliente/pagar-facturas'
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
