import { NextResponse } from "next/server";

// 👇 VACUNA 1: Forzar modo dinámico (Vital para rutas de administración)
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 👇 VACUNA 2: Imports dentro de la función (Lazy Loading)
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;

    const session = await auth();
    
    // 1. SEGURIDAD: Solo Admin o Warehouse pueden entrar aquí
    const userRole = session?.user?.role;
    const allowedRoles = ['ADMIN', 'WAREHOUSE', 'SUPERUSER'];

    if (!session?.user?.id || !allowedRoles.includes(userRole as string)) {
        return NextResponse.json({ message: "Acceso denegado. Se requiere nivel Administrativo." }, { status: 403 });
    }

    const body = await req.json();
    
    // 👇 AQUÍ EXTRAEMOS LA TABLA DE ADUANAS A LA LISTA DE VARIABLES
    const { 
        packageId, 
        weight, 
        length, 
        width, 
        height, 
        photoUrl, 
        description, 
        status, 
        invoiceUrl, 
        declaredValue,
        customsItems // 🔥 NUEVO CAMPO: Tabla detallada de aduanas
    } = body;

    if (!packageId) {
        return NextResponse.json({ message: "Falta el ID del paquete" }, { status: 400 });
    }

    // 2. ACTUALIZAR PAQUETE
    const updatedPackage = await prisma.package.update({
        where: { id: packageId },
        data: {
            // Convertimos a números (float) para evitar errores en la DB
            weightLbs: weight ? parseFloat(weight) : undefined,
            lengthIn: length ? parseFloat(length) : undefined,
            widthIn: width ? parseFloat(width) : undefined,
            heightIn: height ? parseFloat(height) : undefined,
            
            // 🔥 Guardamos el Valor Declarado Total (Float)
            declaredValue: declaredValue ? parseFloat(declaredValue) : undefined,
            
            // 🔥 GUARDAMOS LA TABLA DE ADUANAS (JSON)
            customsItems: customsItems !== undefined ? customsItems : undefined,
            
            // Campos de texto importantes
            description: description || undefined, // Actualizamos notas/descripción en texto
            photoUrlMiami: photoUrl || undefined,  // Actualizamos la foto del paquete
            
            // 👇 GUARDAMOS LA FACTURA (Si se subió alguna)
            invoiceUrl: invoiceUrl || undefined,
            
            // Confirmamos el estado (ej: 'EN_ALMACEN')
            status: status || 'EN_ALMACEN' 
        }
    });

    console.log(`🔧 Paquete ${packageId} actualizado con valor/factura por ${session.user.email}`);

    return NextResponse.json({ success: true, package: updatedPackage });

  } catch (error: any) {
    console.error("Error corrigiendo paquete:", error);
    return NextResponse.json({ message: "Error interno al actualizar." }, { status: 500 });
  }
}