import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const { auth } = await import("@/auth");
  const prisma = (await import("@/lib/prisma")).default;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ packages: [] }, { status: 401 });
    }

    const { getTenant } = await import('@/lib/tenant');
    const tenant = await getTenant();

    const packages = await prisma.package.findMany({
      where: {
        userId: session.user.id,
        tenant_id: tenant?.id || undefined,
        status: { in: ['EN_ALMACEN', 'EN_MIAMI', 'RECIBIDO_MIAMI', 'DISPONIBLE'] },
        consolidatedShipmentId: null,
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        gmcTrackingNumber: true,
        description: true,
        weightLbs: true,
        lengthIn: true,
        widthIn: true,
        heightIn: true,
        status: true,
      }
    });

    return NextResponse.json({ packages });

  } catch (error) {
    console.error("Error fetching en-almacen packages:", error);
    return NextResponse.json({ packages: [] }, { status: 500 });
  }
}