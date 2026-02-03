import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const session = await auth();
        
        // 1. Validar Permisos (Admin o Bodega)
        if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE')) {
            return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
        }

        const { packageId, deliveredBy } = await req.json();

        if (!packageId || !deliveredBy) {
            return NextResponse.json({ message: 'Faltan datos: ID o Nombre del Personal.' }, { status: 400 });
        }

        // 2. Intentar buscar como Paquete Individual (Paquete Suelto)
        const pkg = await prisma.package.findUnique({ 
            where: { id: packageId } 
        });

        if (pkg) {
            await prisma.package.update({
                where: { id: packageId },
                data: {
                    status: 'ENTREGADO',           // Cambia estado para que vaya al historial
                    deliveredBy: deliveredBy,      // 🔥 GUARDA EL NOMBRE DEL PERSONAL
                    deliverySignature: 'ENTREGA_TIENDA', // Marca interna opcional
                    updatedAt: new Date()
                }
            });
            return NextResponse.json({ success: true, message: 'Paquete entregado correctamente.' });
        }

        // 3. Intentar buscar como Consolidación (Shipment)
        const shipment = await prisma.consolidatedShipment.findUnique({
            where: { id: packageId }
        });

        if (shipment) {
            // Actualizar la Consolidación Principal
            await prisma.consolidatedShipment.update({
                where: { id: packageId },
                data: {
                    status: 'ENTREGADO',
                    deliveredBy: deliveredBy,      // 🔥 GUARDA EL NOMBRE DEL PERSONAL
                    updatedAt: new Date()
                }
            });

            // Actualizar también los paquetes que están dentro (para mantener consistencia)
            await prisma.package.updateMany({
                where: { consolidatedShipmentId: packageId },
                data: {
                    status: 'ENTREGADO',
                    deliveredBy: deliveredBy,
                    updatedAt: new Date()
                }
            });

            return NextResponse.json({ success: true, message: 'Consolidado entregado correctamente.' });
        }

        return NextResponse.json({ message: 'El paquete o envío no existe.' }, { status: 404 });

    } catch (error) {
        console.error("Error en API deliver-store:", error);
        return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
    }
}