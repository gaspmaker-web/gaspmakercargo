import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; 

export const dynamic = 'force-dynamic'; 

export async function GET() {
    try {
        // 1. Paquetes Sueltos Pagados
        const singlePackagesPaid = await prisma.package.count({
            where: {
                stripePaymentId: { not: null }, 
                finalTrackingNumber: null,
                shippingLabelUrl: null, // 🔥 REGLA DE ORO: Si ya tiene etiqueta, no es pendiente
                consolidatedShipmentId: null, // 🔥 EVITA EL DOBLE CONTEO
                status: {
                    notIn: ['ENVIADO', 'ENTREGADO', 'RECIBIDO_EN_TIENDA', 'CANCELADO', 'LISTO PARA ENVÍO', 'LISTO_PARA_ENVIO', 'DELIVERED', 'EN_PROCESO_ENVIO'] 
                }
            }
        });

        // 2. Consolidaciones y Envíos Individuales "Envueltos"
        const consolidationsPaid = await prisma.consolidatedShipment.count({
            where: {
                paymentId: { not: null },       
                finalTrackingNumber: null,
                shippingLabelUrl: null, // 🔥 REGLA DE ORO: Apaga la alerta si ya le compraste el Label
                status: {
                    notIn: ['ENVIADO', 'ENTREGADO', 'CANCELADO', 'LISTO PARA ENVÍO', 'LISTO_PARA_ENVIO', 'DELIVERED', 'EN_PROCESO_ENVIO'] 
                }
            }
        });

        // 3. Pickups Pagados
        const pickupsPaid = await prisma.pickupRequest.count({
            where: {
                stripePaymentId: { not: null }, 
                status: {
                    notIn: ['ENTREGADO', 'COMPLETADO', 'CANCELADO', 'DELIVERED'] 
                },
                serviceType: {
                    not: 'STORAGE_FEE'
                }
            }
        });

        const totalPaidAlerts = singlePackagesPaid + consolidationsPaid + pickupsPaid;

        return NextResponse.json({ count: totalPaidAlerts });
    } catch (error) {
        return NextResponse.json({ count: 0 }, { status: 500 });
    }
}