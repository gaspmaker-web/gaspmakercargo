import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    // 1. Verificar sesión
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
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
    if (existingPackage.userId !== session.user.id && session.user.role !== 'ADMIN') {
        console.error(`❌ [API update-invoice] Usuario ${session.user.id} intentó editar paquete ajeno.`);
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