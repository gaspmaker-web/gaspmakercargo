import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { mailItemId } = await req.json();

    if (!mailItemId) return NextResponse.json({ error: 'Falta el ID del sobre' }, { status: 400 });

    // 1. Buscamos el sobre físico
    const mailItem = await prisma.mailItem.findUnique({ where: { id: mailItemId } });
    if (!mailItem) return NextResponse.json({ error: 'Sobre no encontrado' }, { status: 404 });

    // 2. Transacción de Alta Seguridad
    await prisma.$transaction(async (tx) => {
        // Extraemos un ID corto para los trackings
        const uniqueId = mailItem.id.substring(0, 8).toUpperCase();

        // Convertimos las onzas del sobre a libras para el paquete (1 lb = 16 oz)
        const pesoEnLibras = mailItem.weightOz ? (mailItem.weightOz / 16) : 0.1;

       // A. Creamos el PAQUETE oficial
        const newPackage = await tx.package.create({
            data: {
                userId: mailItem.userId,
                carrierTrackingNumber: `DOC-${uniqueId}`, 
                gmcTrackingNumber: `GMC-DOC-${uniqueId}`, 
                courier: 'Buzón Virtual',
                weightLbs: pesoEnLibras, 
                // 🔥 Ahora toma las medidas reales, o usa las estándar como respaldo de seguridad
                lengthIn: mailItem.lengthIn || 12,  
                widthIn: mailItem.widthIn || 9,    
                heightIn: mailItem.heightIn || 0.5, 
                description: mailItem.senderName ? `Documento de: ${mailItem.senderName}` : 'Documento Físico (Enviado desde Buzón)',
                status: 'RECIBIDO_MIAMI', // 🔥 CAMBIO PROFESIONAL: El sistema lo reconocerá nativamente sin parches en el frontend
                receiptUrl: mailItem.envelopeImageUrl, 
            }
        });

        // B. Actualizamos el Sobre para marcar que ya se fue a carga
        await tx.mailItem.update({
            where: { id: mailItemId },
            data: { status: 'MOVED_TO_CARGO', cargoPackageId: newPackage.id } 
        });

        // C. Le avisamos al cliente
        await tx.notification.create({
            data: {
                userId: mailItem.userId,
                title: "📦 Documento movido a Carga",
                message: `Tu documento ya está en tu lista de paquetes (Ref: DOC-${uniqueId}). ¡Puedes consolidarlo cuando quieras!`,
                type: "INFO",
                href: "/dashboard-cliente/paquetes"
            }
        });
    });

    return NextResponse.json({ success: true, message: 'Convertido a paquete exitosamente.' });

  } catch (error) {
    console.error("Error al convertir a paquete:", error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}