import { NextResponse } from 'next/server';

// 👇 VACUNA 1: Forzar modo dinámico
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // 👇 VACUNA 2: Imports dentro de la función (Lazy Loading)
  const { auth } = await import("@/auth");
  const prisma = (await import("@/lib/prisma")).default;

  const session = await auth();

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE')) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');

  if (!query || query.length < 3) {
    return NextResponse.json({ message: "Escribe al menos 3 caracteres" }, { status: 400 });
  }
try {
    // 🏢 Tenant filter
    const { getTenant } = await import('@/lib/tenant');
    const tenant = await getTenant();
    const tenantFilter = tenant?.id ? { tenant_id: tenant.id } : {};

    const users = await prisma.user.findMany({
      where: {
        ...tenantFilter,
        OR: [
          { email: { startsWith: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
          { suiteNo: { contains: query, mode: 'insensitive' } },
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        suiteNo: true,
        countryCode: true
      },
      take: 5
    });

    if (users.length === 0) {
      return NextResponse.json({ message: "Cliente no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ 
      client: users[0], 
      users: users 
    });

  } catch (error) {
    console.error("Error buscando cliente:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}