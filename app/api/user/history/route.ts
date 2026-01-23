import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const userId = session.user.id;

    // 1. Pickup Requests (Logística Local)
    const localRequests = await prisma.pickupRequest.findMany({
        where: { userId }, orderBy: { createdAt: 'desc' }
    });

    // 2. Consolidated Shipments (Incluimos paquetes para leer sus descripciones)
    const internationalShipments = await prisma.consolidatedShipment.findMany({
        where: { userId }, 
        include: { 
            packages: {
                select: { description: true, gmcTrackingNumber: true }
            } 
        }, 
        orderBy: { createdAt: 'desc' }
    });

    // 3. Normalizar
    const normalizedLocal = localRequests.map(req => ({
        id: req.id,
        createdAt: req.createdAt,
        status: req.status,
        serviceType: req.serviceType, 
        description: req.description,
        totalPaid: req.totalPaid,
        originAddress: req.originAddress,
        dropOffAddress: req.dropOffAddress,
        photoPickupUrl: req.photoPickupUrl,
        photoDeliveryUrl: req.photoDeliveryUrl,
        signatureUrl: req.signatureUrl, 
        tookanLink: req.tookanLink      
    }));

    const normalizedIntl = internationalShipments.map(ship => {
        // 🔥 CLASIFICACIÓN ESTRICTA
        const isStorage = ship.serviceType === 'STORAGE_FEE';
        const finalType = isStorage ? 'STORAGE_FEE' : 'SHIPPING_INTL'; 
        
        // 🔥 LÓGICA DE CONTENIDO DEL PAQUETE 🔥
        // Generamos un string con los nombres de los paquetes (ej: "Dede, 3234233, Zapatos...")
        const packageContent = ship.packages.length > 0
            ? ship.packages.map(p => p.description || p.gmcTrackingNumber || 'Paquete').join(', ')
            : 'Sin detalle de contenido';

        return {
            id: ship.id,
            createdAt: ship.createdAt,
            status: ship.status,
            serviceType: finalType, 
            
            // 1. EL TÍTULO (description): Lo dejamos como el tipo de envío
            description: isStorage 
                ? `Retiro en Bodega` 
                : `Envío Internacional (${ship.selectedCourier || 'GMC'})`,
            
            totalPaid: ship.totalAmount,
            courier: ship.selectedCourier,

            // 2. EL DETALLE (service): Aquí metemos los nombres de los paquetes
            // Esto reemplazará el texto "Gestión interna..." o el servicio del courier
            service: isStorage 
                ? `${ship.packages.length} paquetes` 
                : packageContent, 
            
            tracking: ship.finalTrackingNumber, 
            packagesCount: ship.packages.length
        };
    });

    const allRequests = [...normalizedLocal, ...normalizedIntl].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ requests: allRequests });

  } catch (error) {
    console.error("Error history:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}