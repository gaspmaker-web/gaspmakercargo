import { NextResponse } from "next/server";
// 🔥 1. Importamos revalidatePath para limpiar el caché de la lista
import { revalidatePath } from "next/cache";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;

    const session = await auth();
    
    const body = await req.json();
    
    const { 
        packageId, 
        weightLbs, weight,
        lengthIn, length,
        widthIn, width,
        heightIn, height,
        warehouseLocation,
        carrierTrackingNumber,
        receiptUrl,
        // 🔥 AHORA SÍ EXTRAEMOS LA FACTURA, LA FOTO Y LAS NOTAS DEL FRONTEND
        invoiceUrl,
        photoUrlMiami,
        description
    } = body;

    // Calculamos valores finales asegurando números
    const finalWeight = parseFloat(weightLbs || weight || 0);
    const finalLength = parseFloat(lengthIn || length || 0);
    const finalWidth = parseFloat(widthIn || width || 0);
    const finalHeight = parseFloat(heightIn || height || 0);

    const updatedPackage = await prisma.package.update({
      where: { id: packageId },
      data: {
        status: 'RECIBIDO_MIAMI', // ✅ Esto cambia el estado
        carrierTrackingNumber: carrierTrackingNumber,
        weightLbs: finalWeight,
        lengthIn: finalLength,
        widthIn: finalWidth,
        heightIn: finalHeight,
        receiptUrl: receiptUrl || null, 
        
        // 🔥 GUARDAMOS LA FACTURA Y LA FOTO DE EVIDENCIA 🔥
        invoiceUrl: invoiceUrl !== undefined ? invoiceUrl : undefined,
        photoUrlMiami: photoUrlMiami !== undefined ? photoUrlMiami : undefined,

        // Integramos las notas internas del formulario sin perder la ubicación
        description: description !== undefined ? description : (warehouseLocation ? `(Loc: ${warehouseLocation})` : undefined), 
        
        updatedAt: new Date()
      }
    });

    // 🔥 2. FORZAMOS la actualización de las listas para que se vea el cambio al instante
    revalidatePath('/dashboard-admin/paquetes');
    revalidatePath('/dashboard-cliente/paquetes');

    return NextResponse.json({ success: true, package: updatedPackage });

  } catch (error) {
    console.error("Error receiving package:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}