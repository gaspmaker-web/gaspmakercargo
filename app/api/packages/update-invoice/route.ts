import { NextResponse } from 'next/server';

// 👇 VACUNA 1: Forzar modo dinámico (Evita ejecución en Build)
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 👇 VACUNA 2: Imports dentro de la función (Lazy Loading)
    const prisma = (await import('@/lib/prisma')).default;
    const { auth } = await import('@/auth');

    // 1. Verificar sesión (web NextAuth o mobile Bearer JWT)
    const { jwtVerify } = await import('jose');
    const req2 = req as any;
    const authHeader = req2.headers?.get?.('authorization') ?? '';
    let userId: string | null = null;
    let userRole: string = 'CLIENTE';

    if (authHeader.startsWith('Bearer ')) {
      try {
        const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET ?? '');
        const { payload } = await jwtVerify(authHeader.slice(7), secret);
        userId = ((payload as any).id ?? (payload as any).userId) as string;
        userRole = (payload as any).role ?? 'CLIENTE';
      } catch { return NextResponse.json({ message: 'No autorizado' }, { status: 401 }); }
    } else {
      const session = await auth();
      if (!session?.user?.id) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
      userId = session.user.id;
      userRole = session.user.role ?? 'CLIENTE';
    }

    // 2. Obtener datos del cuerpo
    const body = await req.json();
    const { packageId, invoiceUrl } = body;

    // 3. Validaciones básicas
    if (!packageId || !invoiceUrl) {
      console.error("❌ [API update-invoice] Faltan datos:", { packageId, invoiceUrl });
      return NextResponse.json({ message: 'Faltan datos requeridos (packageId o invoiceUrl)' }, { status: 400 });
    }

    console.log(`🔄 [API update-invoice] Intentando actualizar paquete ${packageId} con URL: ${invoiceUrl}`);

    // 4. Verificar que el paquete exista y pertenezca al usuario (Seguridad)
    const existingPackage = await prisma.package.findUnique({
      where: { id: packageId },
      select: { userId: true }
    });

    if (!existingPackage) {
        console.error(`❌ [API update-invoice] Paquete ${packageId} no encontrado en BD.`);
        return NextResponse.json({ message: 'Paquete no encontrado' }, { status: 404 });
    }

    // Solo permitimos si es el dueño o es Admin
    if (existingPackage.userId !== userId && userRole !== 'ADMIN') {
        return NextResponse.json({ message: 'No tienes permiso para modificar este paquete' }, { status: 403 });
    }

    // 5. Actualizar en la base de datos
    const updatedPackage = await prisma.package.update({
      where: { id: packageId },
      data: {
        invoiceUrl: invoiceUrl,
        updatedAt: new Date() // Actualizamos la fecha de modificación para tener registro
      },
    });

    console.log("✅ [API update-invoice] Paquete actualizado correctamente.");
    return NextResponse.json({ success: true, package: updatedPackage });

  } catch (error: any) {
    // 🔥 CAPTURA DE ERRORES DETALLADA 🔥
    console.error("❌🔥 [API CRASH] Error fatal en update-invoice:", error);
    
    // Devolvemos el mensaje de error exacto para que el frontend (y tú) sepan qué pasó
    return NextResponse.json(
        { message: 'Error interno del servidor al actualizar invoice', error: error.message },
        { status: 500 }
    );
  }
}