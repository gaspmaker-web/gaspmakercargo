import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { generateGmcTracking } from '@/lib/utils'; 

export async function POST(req: Request) {
  try {
    // 1. Verificar permisos
    const session = await auth();
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE')) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    // 2. Recibir datos del Admin
    const body = await req.json();
    const { 
      userId, 
      countryCode, 
      carrierTrackingNumber, 
      description, 
      weightLbs, 
      lengthIn, 
      widthIn, 
      heightIn, 
      photoUrlMiami,
      // 🔥 NUEVO CAMPO: Recibimos el valor declarado
      declaredValue 
    } = body;

    // Validaciones
    if (!carrierTrackingNumber || !weightLbs) {
      return NextResponse.json({ message: "Faltan datos obligatorios (Tracking o Peso)" }, { status: 400 });
    }

    // --- LÓGICA DE CONEXIÓN CON PRE-ALERTA ---
    
    // A. Buscar si YA existe una pre-alerta con ese tracking
    const existingPackage = await prisma.package.findFirst({
      where: {
        carrierTrackingNumber: carrierTrackingNumber,
        status: 'PRE_ALERTA' // Solo nos interesa si está en pre-alerta
      }
    });

    if (existingPackage) {
      // --- CASO 1: ES UNA PRE-ALERTA (ACTUALIZAR) ---
      console.log("Coincidencia encontrada con Pre-Alerta. Actualizando...");
      
      const updatedPackage = await prisma.package.update({
        where: { id: existingPackage.id },
        data: {
          status: 'RECIBIDO_MIAMI', // Cambiamos el estado
          weightLbs,                // Agregamos el peso real
          lengthIn,
          widthIn,
          heightIn,
          photoUrlMiami: photoUrlMiami || null, // Agregamos la foto del almacén
          
          // 🔥 GUARDAMOS EL VALOR (Si el admin lo ingresó, actualizamos la pre-alerta)
          declaredValue: declaredValue ? parseFloat(declaredValue) : existingPackage.declaredValue,

          // NO tocamos 'invoiceUrl' ni 'description', así se mantiene lo que subió el cliente
          // NO tocamos 'userId', respetamos al dueño original de la pre-alerta
        }
      });

      return NextResponse.json({ 
          message: "Paquete pre-alertado recibido correctamente.", 
          package: updatedPackage,
          gmcTrackingNumber: updatedPackage.gmcTrackingNumber 
      }, { status: 200 });

    } else {
      // --- CASO 2: ES UN PAQUETE NUEVO (CREAR) ---
      console.log("Paquete nuevo. Creando registro...");

      if (!userId) {
         return NextResponse.json({ message: "Para paquetes nuevos, debes seleccionar un cliente." }, { status: 400 });
      }

      const trackingCountry = countryCode || 'US';
      const gmcTracking = generateGmcTracking(trackingCountry);

      const newPackage = await prisma.package.create({
        data: {
          userId,
          carrierTrackingNumber,
          gmcTrackingNumber: gmcTracking,
          description: description || "Paquete recibido en Miami",
          weightLbs,
          lengthIn,
          widthIn,
          heightIn,
          status: 'RECIBIDO_MIAMI',
          photoUrlMiami: photoUrlMiami || null,
          invoiceUrl: null,
          
          // 🔥 GUARDAMOS EL VALOR DECLARADO (Default 0)
          declaredValue: declaredValue ? parseFloat(declaredValue) : 0
        }
      });

      return NextResponse.json(newPackage, { status: 201 });
    }

  } catch (error: any) {
    console.error("Error procesando paquete:", error);
    // Si falla por tracking duplicado que no es pre-alerta
    if (error.code === 'P2002') {
        return NextResponse.json({ message: "Este paquete ya fue registrado anteriormente." }, { status: 409 });
    }
    return NextResponse.json({ message: "Error interno." }, { status: 500 });
  }
}