import { NextResponse } from "next/server";

// 👇 VACUNA 1: Forzar modo dinámico (Para que Vercel ignore esto en el Build)
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 👇 VACUNA 2: Imports dentro de la función (Lazy Loading)
    const prisma = (await import("@/lib/prisma")).default;
    const { auth } = await import("@/auth");
    const { generateLockerNumber } = await import('@/lib/utils');

    // 1. Autenticación: Verificar que el usuario está logueado
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ message: "No autorizado. Por favor inicia sesión." }, { status: 401 });
    }

    const body = await req.json();
    const {
      trackingNumber, // Viene del input "Número de Tracking"
      carrier,        // Viene de los botones (AMAZON, UPS, FEDEX...)
      description,    // Descripción del artículo
      value,          // Valor declarado en USD
      invoiceUrl,     // URL de la imagen/pdf subida a Cloudinary
    } = body;

    // 2. Validaciones Básicas
    if (!trackingNumber || !description) {
      return NextResponse.json({ message: "El número de tracking y la descripción son obligatorios." }, { status: 400 });
    }

    // 3. Generar Tracking Interno (GMC)
    // Usamos el prefijo 'PRE' para identificar que aún no ha llegado a bodega
    const gmcTrackingNumber = generateLockerNumber ? generateLockerNumber('PRE') : `PRE-${Math.floor(100000 + Math.random() * 900000)}`;

    // 4. Guardar en Base de Datos (Con los nuevos campos del Schema)
    const newPackage = await prisma.package.create({
      data: {
        userId: session.user.id, 
        status: "PRE_ALERTA",
        
        // Datos de Rastreo Externo
        carrierTrackingNumber: trackingNumber.toUpperCase(), 
        
        // Datos Internos
        gmcTrackingNumber: gmcTrackingNumber,
        
        // Información del Producto
        description: description,
        courier: carrier,                               // <--- NUEVO: Guardamos el Transportista
        declaredValue: value ? parseFloat(value) : 0,   // <--- NUEVO: Guardamos el Valor ($)
        
        // Documentación
        invoiceUrl: invoiceUrl || null,
        
        // Inicializamos dimensiones en 0 (se llenan al recibir en bodega)
        weightLbs: 0,
        lengthIn: 0,
        widthIn: 0,
        heightIn: 0,
        
        // Timestamps
        createdAt: new Date(),
        updatedAt: new Date()
      },
    });

    return NextResponse.json({ 
        success: true,
        message: "Pre-Alerta registrada exitosamente.",
        packageId: newPackage.id,
        tracking: newPackage.gmcTrackingNumber
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error al registrar pre-alerta:", error);
    
    // Manejo de error si el tracking ya existe (P2002 es código de duplicado en Prisma)
    if (error.code === 'P2002') {
        return NextResponse.json({ message: "Este número de tracking ya ha sido pre-alertado." }, { status: 409 });
    }

    return NextResponse.json({ message: "Error interno del servidor." }, { status: 500 });
  }
}

