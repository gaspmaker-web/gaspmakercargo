import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    // 🔥 FILTRO MAESTRO PARA INVENTARIO DE RECOGIDA 🔥
    // Buscamos paquetes que el cliente YA PAGÓ y que están marcados para retirar.
    
    const packages = await prisma.package.findMany({
      where: {
        userId: session.user.id,
        
        // 1. Que no haya sido entregado/finalizado todavía
        status: { 
            notIn: ['ENTREGADO', 'DELIVERED', 'COMPLETADO', 'CANCELADO', 'ENTREGADO_HISTORICO'] 
        },

        // 2. Que pertenezca a una Consolidación (Factura) PAGADA
        consolidatedShipment: {
            status: 'PAGADO', // ✅ Requisito: Tiene que estar pagado
            
            // 3. Que sea de tipo PICKUP (Cualquiera de estas variantes sirve)
            OR: [
                // A. Tipo de Servicio explícito
                { serviceType: 'PICKUP' },
                { serviceType: 'Recogida en Tienda' },
                
                // B. Courier seleccionado (Lo que asigna tu PendingBillsClient)
                { selectedCourier: 'CLIENTE_RETIRO' },
                { selectedCourier: 'Recogida en Tienda' },

                // C. Búsqueda de texto en el nombre del servicio (Flexible)
                { courierService: { contains: 'Tienda', mode: 'insensitive' } },
                { courierService: { contains: 'Recogida', mode: 'insensitive' } },
                { courierService: { contains: 'Pickup', mode: 'insensitive' } },
                
                // D. Por si acaso está en el número de envío (ej: PICKUP-843685)
                { gmcShipmentNumber: { contains: 'PICKUP', mode: 'insensitive' } } 
            ]
        }
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        description: true,
        weightLbs: true,
        gmcTrackingNumber: true,
        status: true,
        createdAt: true,
        consolidatedShipment: {
            select: {
                totalAmount: true,
                serviceType: true,
                courierService: true,
                gmcShipmentNumber: true
            }
        }
      }
    });

    return NextResponse.json({ packages });
    
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json({ packages: [] }, { status: 500 });
  }
}