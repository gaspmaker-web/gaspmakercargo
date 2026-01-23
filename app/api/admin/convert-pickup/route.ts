import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

function generateTrackingNumber() {
    return 'GMC-PK-' + Math.floor(100000 + Math.random() * 900000);
}

const weightMap: Record<string, string> = {
    'w_30': 'Pequeño (0-40 lbs)',
    'w_70': 'Mediano (41-70 lbs)',
    'w_110': 'Grande (71-110 lbs)',
    'w_150': 'Muy Grande (111-150 lbs)',
    'w_max': 'Carga Pesada (+151 lbs)',
};

export async function POST(req: Request) {
  try {
    const session = await auth();
    // 1. Seguridad
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE')) {
        return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { pickupId, quantity = 1 } = await req.json();

    // 2. Buscar el Pickup original
    const pickup = await prisma.pickupRequest.findUnique({
        where: { id: pickupId },
    });

    if (!pickup) return NextResponse.json({ message: "Pickup no encontrado" }, { status: 404 });
    
    // 🛑 VALIDACIÓN ANTI-DUPLICADOS 🛑
    // Si ya es PROCESADO (Admin lo hizo) o ENTREGADO (Chofer lo hizo), no creamos otro.
    if (pickup.status === 'PROCESADO' || pickup.status === 'ENTREGADO') {
        return NextResponse.json({ 
            message: "⚠️ Este pickup ya fue procesado por el Chofer o el Admin. Busca el paquete en Inventario." 
        }, { status: 400 });
    }

    const estimacionCliente = weightMap[pickup.weightInfo || ''] || pickup.weightInfo;
    const evidenciaChofer = pickup.photoPickupUrl ? `\n[FOTO CHOFER]: ${pickup.photoPickupUrl}` : '';
    const notaBase = `(Origen: Pickup #${pickup.id.slice(0,6).toUpperCase()}. Est: ${estimacionCliente}.${evidenciaChofer})`;

    const createdPackagesIds: string[] = [];
    const createdTrackingNumbers: string[] = [];

    // 3. Transacción: Crear Paquetes + Cerrar Pickup
    await prisma.$transaction(async (tx) => {
        
        for (let i = 0; i < quantity; i++) {
            const newTracking = generateTrackingNumber();
            const suffix = quantity > 1 ? ` (Pieza ${i + 1} de ${quantity})` : '';
            
            const finalDescription = `${pickup.description || 'Sin descripción'} ${suffix} \n${notaBase}`.trim();

            const newPackage = await tx.package.create({
                data: {
                    gmcTrackingNumber: newTracking,
                    userId: pickup.userId,
                    
                    // Estado INVISIBLE para que nazca oculto hasta medirlo
                    status: 'EN_PROCESAMIENTO', 
                    
                    description: finalDescription,
                    
                    weightLbs: 0,
                    widthIn: 0,
                    heightIn: 0,
                    lengthIn: 0,
                    
                    photoUrlMiami: pickup.photoPickupUrl || null 
                }
            });

            createdPackagesIds.push(newPackage.id);
            createdTrackingNumbers.push(newTracking);
        }

        // Marcar pickup como procesado
        await tx.pickupRequest.update({
            where: { id: pickupId },
            data: { status: 'PROCESADO' } 
        });
    });

    return NextResponse.json({ 
        success: true, 
        trackingNumbers: createdTrackingNumbers, 
        packageIds: createdPackagesIds 
    });

  } catch (error) {
    console.error("Error converting pickup:", error);
    return NextResponse.json({ message: "Error DB: " + (error as Error).message }, { status: 500 });
  }
}