import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; 

export const dynamic = 'force-dynamic'; 

export async function GET() {
    try {
        const singlePackagesPaid = await prisma.package.count({
            where: {
                stripePaymentId: { not: null }, 
                finalTrackingNumber: null,      
                status: {
                    notIn: ['ENVIADO', 'ENTREGADO', 'RECIBIDO_EN_TIENDA', 'CANCELADO', 'LISTO PARA ENVÍO', 'LISTO_PARA_ENVIO', 'DELIVERED'] 
                },
                OR: [
                    { consolidatedShipmentId: null },
                    { consolidatedShipment: { serviceType: { not: 'CONSOLIDATION' } } }
                ]
            }
        });

        const consolidationsPaid = await prisma.consolidatedShipment.count({
            where: {
                paymentId: { not: null },       
                finalTrackingNumber: null,      
                status: {
                    notIn: ['ENVIADO', 'ENTREGADO', 'CANCELADO', 'LISTO PARA ENVÍO', 'LISTO_PARA_ENVIO', 'DELIVERED'] 
                }
            }
        });

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