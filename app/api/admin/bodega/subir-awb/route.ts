import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { uploadToR2 } from '@/lib/r2';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const id = formData.get('id') as string;
    const type = formData.get('type') as string;
    const file = formData.get('file') as File;

    if (!file) {
        return NextResponse.json({ error: "No se recibió el documento." }, { status: 400 });
    }

    const fileName = `awb/${type}/${id}-${Date.now()}.pdf`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const publicUrl = await uploadToR2(buffer, fileName, 'application/pdf');

    if (type === 'CONSOLIDATED') {
      await prisma.consolidatedShipment.update({ 
        where: { id }, 
        data: { awbDocumentUrl: publicUrl } 
      });
    } else {
      await prisma.package.update({ 
        where: { id }, 
        data: { awbDocumentUrl: publicUrl } 
      });
    }

    return NextResponse.json({ success: true, url: publicUrl });

  } catch (error) {
    console.error("Error interno de API:", error);
    return NextResponse.json({ error: "Error procesando el archivo" }, { status: 500 });
  }
}
