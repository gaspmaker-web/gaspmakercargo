import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { uploadToR2 } from '@/lib/r2';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    const { getTenant } = await import('@/lib/tenant');
    const tenant = await getTenant();

    const formData = await req.formData();
    const userId = formData.get('userId') as string;
    const imageFile = formData.get('image') as File;
    const isDamaged = formData.get('isDamaged') === 'true';
    const totalOz = parseFloat(formData.get('totalOz') as string) || 0;
    const trackingNumber = formData.get('trackingNumber') as string;
    const lengthInStr = formData.get('lengthIn') as string;
    const widthInStr = formData.get('widthIn') as string;
    const heightInStr = formData.get('heightIn') as string;
    const lengthIn = lengthInStr ? parseFloat(lengthInStr) : null;
    const widthIn = widthInStr ? parseFloat(widthInStr) : null;
    const heightIn = heightInStr ? parseFloat(heightInStr) : null;

    if (!userId || !imageFile) {
      return NextResponse.json({ error: 'Faltan datos requeridos (Usuario o Foto)' }, { status: 400 });
    }

    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeName = imageFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const url = await uploadToR2(buffer, `mail_items/${Date.now()}-${safeName}`, imageFile.type);

    const mailItem = await prisma.mailItem.create({
      data: {
        userId,
        tenant_id: tenant?.id || null,
        trackingNumber,
        envelopeImageUrl: url,
        isDamaged,
        weightOz: totalOz,
        lengthIn,
        widthIn,
        heightIn,
        status: 'UNREAD',
      }
    });

    try {
      await prisma.notification.create({
        data: {
          userId,
          title: "newMailTitle",
          message: JSON.stringify({ key: "newMailDesc", weight: totalOz.toFixed(2) }),
          type: "INFO",
          href: "/dashboard-cliente/buzon"
        }
      });
    } catch (notifError) {
      console.warn("No se pudo crear la notificación, pero el sobre se guardó:", notifError);
    }

    return NextResponse.json({ success: true, message: 'Sobre recibido con éxito' });

  } catch (error) {
    console.error('Error recibiendo sobre:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
