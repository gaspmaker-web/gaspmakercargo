import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: Request) {
  try {
    const session = await auth();
    
    // 1. Seguridad: Solo Admin o Warehouse pueden editar paquetes
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE')) {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    
    // Extraemos los datos del formulario
    const { 
      id, 
      carrierTrackingNumber, 
      description, 
      weightLbs, 
      lengthIn, 
      widthIn, 
      heightIn,
      status,        // El estado que envía el formulario (si lo hay)
      photoUrlMiami, // Foto de Bodega
      invoiceUrl     // Factura
    } = body;

    if (!id) {
        return NextResponse.json({ message: "ID de paquete requerido" }, { status: 400 });
    }

    // =====================================================================
    // 🔥 PASO 1: LÓGICA DE REVELADO (EL SECRETO) 🔥
    // =====================================================================
    
    // Primero, buscamos cómo está el paquete AHORA MISMO en la base de datos
    const currentPkg = await prisma.package.findUnique({
        where: { id },
        select: { status: true }
    });

    if (!currentPkg) {
        return NextResponse.json({ message: "Paquete no encontrado" }, { status: 404 });
    }

    // Determinamos el nuevo estado
    // Por defecto usamos lo que mandó el Admin en el dropdown, o mantenemos el actual si no mandó nada
    let finalStatus = status || currentPkg.status; 

    // Convertimos el peso entrante a número para verificarlo
    const newWeight = weightLbs !== undefined ? parseFloat(weightLbs) : 0;

    // LA REGLA DE ORO:
    // Si estaba "Invisible" (EN_PROCESAMIENTO) Y ahora le pusiste peso (> 0)...
    // ¡Lo hacemos visible automáticamente!
    if (currentPkg.status === 'EN_PROCESAMIENTO' && newWeight > 0) {
        finalStatus = 'RECIBIDO_MIAMI';
    }
    
    // =====================================================================
    // PASO 2: GUARDAR EN BASE DE DATOS
    // =====================================================================

    const updatedPackage = await prisma.package.update({
      where: { id },
      data: {
        carrierTrackingNumber,
        description,
        // Aseguramos que los números sean números (flotantes) y no strings
        weightLbs: weightLbs !== undefined ? parseFloat(weightLbs) : undefined,
        lengthIn: lengthIn !== undefined ? parseFloat(lengthIn) : undefined,
        widthIn: widthIn !== undefined ? parseFloat(widthIn) : undefined,
        heightIn: heightIn !== undefined ? parseFloat(heightIn) : undefined,
        
        status: finalStatus, // <--- Usamos el estado calculado (Visible o Invisible)
        
        photoUrlMiami, 
        invoiceUrl,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
        success: true, 
        message: (currentPkg.status === 'EN_PROCESAMIENTO' && finalStatus === 'RECIBIDO_MIAMI') 
            ? "✅ ¡Paquete medido y LIBERADO al cliente!" 
            : "✅ Datos actualizados correctamente",
        pkg: updatedPackage 
    });

  } catch (error) {
    console.error("Error updating package:", error);
    return NextResponse.json({ message: "Error interno al actualizar el paquete" }, { status: 500 });
  }
}