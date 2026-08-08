import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;

    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    // Solo ADMIN puede cambiar roles
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (adminUser?.role?.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo administradores pueden cambiar roles' }, { status: 403 });
    }

    const { userId, role, countryCode } = await req.json();

    if (!userId || !role) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const validRoles = ['CLIENTE', 'DRIVER', 'WAREHOUSE', 'ADMIN'];
    if (!validRoles.includes(role.toUpperCase())) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
    }

    // Actualizar rol y país si es DRIVER
    const updateData: any = { role: role.toUpperCase() };
    if (role.toUpperCase() === 'DRIVER' && countryCode) {
      updateData.countryCode = countryCode.toUpperCase();
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, role: true, countryCode: true }
    });

    console.log(`✅ Rol actualizado: ${updatedUser.name} → ${role} (${countryCode || 'N/A'})`);

    return NextResponse.json({ success: true, user: updatedUser });

  } catch (error: any) {
    console.error('Error updating role:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}