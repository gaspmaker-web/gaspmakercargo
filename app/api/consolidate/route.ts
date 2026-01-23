import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; 
import { auth } from "@/auth";
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: "No autorizado." }, { status: 401 });
    
    // 1. Obtener datos del Body (Incluyendo los nuevos campos de Admin)
    const body = await req.json();
    const { 
        packageIds, 
        finalWeight, 
        finalDimensions, 
        finalValue, // 🔥 NUEVO: Recibimos el Valor Declarado
        userId: targetUserId // Si es Admin, recibimos el ID del cliente
    } = body;

    // 2. Lógica de Usuario vs Admin
    // Si es ADMIN, usamos el userId que viene en el body. Si es CLIENTE, usamos su session ID.
    const userRole = session.user.role;
    const isAdmin = userRole === 'ADMIN' || userRole === 'WAREHOUSE';
    const userId = (isAdmin && targetUserId) ? targetUserId : session.user.id;

    if (!packageIds || packageIds.length === 0) {
      return NextResponse.json({ message: "Selecciona al menos un paquete." }, { status: 400 });
    }

    if (packageIds.length > 7) {
        return NextResponse.json({ message: "Máximo 7 paquetes por envío." }, { status: 400 });
    }

    // --- TRANSACCIÓN ---
    const result = await prisma.$transaction(async (tx) => {
      
      const validPackages = await tx.package.findMany({
        where: {
          id: { in: packageIds },
          userId: userId, 
          // Si es Admin creando la consolidación directa, permitimos paquetes que ya estén en almacén
          // Si es Cliente, deben estar en 'RECIBIDO_MIAMI'
          status: isAdmin ? undefined : "RECIBIDO_MIAMI",
        },
        select: { id: true, weightLbs: true, description: true, gmcTrackingNumber: true }
      });

      if (validPackages.length !== packageIds.length) {
        throw new Error("Algunos paquetes no están disponibles.");
      }

      // ⚖️ REGLA: 
      // Si se envían VARIOS paquetes, NINGUNO puede exceder 50 lbs.
      // Si se envía UNO solo, permitimos cualquier peso.
      if (packageIds.length > 1) {
          const overweightPackage = validPackages.find(p => (p.weightLbs || 0) > 50);
          if (overweightPackage) {
              throw new Error(`El paquete "${overweightPackage.description}" pesa ${overweightPackage.weightLbs} Lbs. Al ser carga pesada, debe enviarse individualmente (no se puede consolidar en grupo).`);
          }
      }

      // Crear envío maestro
      const user = await tx.user.findUnique({ where: { id: userId }, select: { countryCode: true } });
      const countryCode = user?.countryCode || 'GMC';
      const masterTracking = `M-${countryCode}-${nanoid()}`;

      // Si hay Peso Final (Admin), el estado es 'EN_ALMACEN' (Listo para pagar). Si no, es 'SOLICITUD'.
      const initialStatus = (isAdmin && finalWeight) ? "EN_ALMACEN" : "SOLICITUD_CONSOLIDACION";

      const newConsolidatedShipment = await tx.consolidatedShipment.create({
        data: {
          gmcShipmentNumber: masterTracking,
          status: initialStatus,
          destinationCountryCode: countryCode,
          userId: userId,
          
          // 🔥 GUARDAMOS LOS DATOS FINALES DEL ADMIN
          weightLbs: finalWeight ? parseFloat(finalWeight) : undefined,
          lengthIn: finalDimensions?.length ? parseFloat(finalDimensions.length) : undefined,
          widthIn: finalDimensions?.width ? parseFloat(finalDimensions.width) : undefined,
          heightIn: finalDimensions?.height ? parseFloat(finalDimensions.height) : undefined,
          
          // 🔥 AQUÍ SE GUARDA EL VALOR PARA EL CÁLCULO DE SEGURO
          declaredValue: finalValue ? parseFloat(finalValue) : 0,
        },
      });

      await tx.package.updateMany({
        where: { id: { in: packageIds } },
        data: {
          status: (isAdmin && finalWeight) ? "CONSOLIDADO" : "EN_PROCESO_CONSOLIDACION",
          consolidatedShipmentId: newConsolidatedShipment.id,
        },
      });

      return newConsolidatedShipment;
    });

    return NextResponse.json({
        success: true,
        message: "Procesado correctamente.",
        masterTracking: result.gmcShipmentNumber
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}