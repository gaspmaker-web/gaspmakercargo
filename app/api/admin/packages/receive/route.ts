import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth"; 

// 👇 ESTA LÍNEA ES LA SOLUCIÓN (La vacuna para el error de Build)
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await auth();
    // Validar rol de admin aquí si es necesario
    
    const body = await req.json();
    const { 
        packageId, 
        weightLbs, 
        lengthIn, 
        widthIn, 
        heightIn, 
        warehouseLocation,
        carrierTrackingNumber, // <--- EL TRACKING CORREGIDO
        receiptUrl             // <--- LA FOTO DE RECEPCIÓN
    } = body;

    // Actualizar el paquete
    const updatedPackage = await prisma.package.update({
      where: { id: packageId },
      data: {
        status: 'RECIBIDO_MIAMI', 
        
        // Actualizamos Tracking (Por si el cliente lo puso mal)
        carrierTrackingNumber: carrierTrackingNumber,

        // Datos Físicos
        weightLbs: parseFloat(weightLbs),
        lengthIn: parseFloat(lengthIn),
        widthIn: parseFloat(widthIn),
        heightIn: parseFloat(heightIn),
        
        // Guardamos la ubicación y la foto en 'description' o un campo específico
        // Nota: Si no tienes campo 'receiptUrl' en la BD, lo guardamos en notas.
        // Pero idealmente deberías tener un campo 'photoUrl'. 
        // Aquí asumiré que usamos 'receiptUrl' o lo anexamos a la descripción si no existe el campo.
        
        // Opción Recomendada: Si tu Schema tiene receiptUrl, úsalo. 
        // Si no, lo guardamos temporalmente así:
        receiptUrl: receiptUrl || null, 
        
        // Guardamos la ubicación en la descripción interna (o campo location si existe)
        description: `(Loc: ${warehouseLocation})`, 
        
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, package: updatedPackage });

  } catch (error) {
    console.error("Error receiving package:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}