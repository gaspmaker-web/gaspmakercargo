import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { put } from '@vercel/blob';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const formData = await req.formData();
    const userId = formData.get('userId') as string;
    const imageFile = formData.get('image') as File;
    const isDamaged = formData.get('isDamaged') === 'true';
    const totalOz = parseFloat(formData.get('totalOz') as string) || 0;

    // 🔥 NUEVO: Extraemos el tracking number que viene del frontend
    const trackingNumber = formData.get('trackingNumber') as string;

    // 🔥 Extraemos las dimensiones si vienen en el formulario
    const lengthInStr = formData.get('lengthIn') as string;
    const widthInStr = formData.get('widthIn') as string;
    const heightInStr = formData.get('heightIn') as string;

    const lengthIn = lengthInStr ? parseFloat(lengthInStr) : null;
    const widthIn = widthInStr ? parseFloat(widthInStr) : null;
    const heightIn = heightInStr ? parseFloat(heightInStr) : null;

    if (!userId || !imageFile) {
      return NextResponse.json({ error: 'Faltan datos requeridos (Usuario o Foto)' }, { status: 400 });
    }

    // 1. Subir foto a la nube (Vercel Blob)
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeName = imageFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    
    // Guardamos en una carpeta especial para los sobres
    const { url } = await put(`mail_items/${Date.now()}-${safeName}`, buffer, {
      access: 'public',
      contentType: imageFile.type,
    });

    // 2. Crear el registro oficial en la Base de Datos
    const mailItem = await prisma.mailItem.create({
      data: {
        userId: userId,
        trackingNumber: trackingNumber, // 🔥 NUEVO: Guardamos el tracking number en la BD
        envelopeImageUrl: url,
        isDamaged: isDamaged,
        weightOz: totalOz,
        lengthIn: lengthIn, // 🔥 Guardamos el Largo
        widthIn: widthIn,   // 🔥 Guardamos el Ancho
        heightIn: heightIn, // 🔥 Guardamos el Grosor
        status: 'UNREAD', 
        // Nota: senderName ya no es requerido
      }
    });

    // 3. Crear notificación interna para el cliente en su panel (MÉTODO ENTERPRISE MULTILINGÜE)
    try {
      await prisma.notification.create({
        data: {
          userId: userId,
          title: "newMailTitle", // 🔑 Guardamos la CLAVE, no el texto fijo en español
          // 🔑 Guardamos la CLAVE del mensaje y la VARIABLE (peso) en formato JSON
          message: JSON.stringify({ 
            key: "newMailDesc", 
            weight: totalOz.toFixed(2) 
          }), 
          type: "INFO",
          href: "/dashboard-cliente/buzon" 
        }
      });
    } catch (notifError) {
      console.warn("No se pudo crear la notificación, pero el sobre se guardó:", notifError);
    }

    // 🔥 (Opcional a futuro): Aquí podemos disparar un email con Resend para avisarle al cliente que le llegó algo.

    return NextResponse.json({ success: true, message: 'Sobre recibido con éxito' });

  } catch (error) {
    console.error('Error recibiendo sobre:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}