import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { put } from '@vercel/blob';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const formData = await req.formData();
    const recipientId = formData.get('recipientId') as string;
    const formFile = formData.get('form1583') as File;
    const id1File = formData.get('id1') as File;
    const id2File = formData.get('id2') as File;

    if (!recipientId || !formFile || !id1File || !id2File) {
      return NextResponse.json({ error: "Faltan documentos requeridos." }, { status: 400 });
    }

    // Seguridad: Verificar que el destinatario sea de este usuario
    const recipient = await prisma.additionalRecipient.findFirst({
        where: { id: recipientId, subscription: { userId: session.user.id } }
    });

    if (!recipient) return NextResponse.json({ error: "Persona no encontrada." }, { status: 404 });

    // Función para subir a Vercel Blob
    const uploadFile = async (file: File) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
      const { url } = await put(`kyc_documents/fix-${Date.now()}-${safeName}`, buffer, {
        access: 'public',
        contentType: file.type,
      });
      return url;
    };

    const formUrl = await uploadFile(formFile);
    const id1Url = await uploadFile(id1File);
    const id2Url = await uploadFile(id2File);

    // Actualizamos la base de datos y lo devolvemos a "PENDIENTE"
    await prisma.additionalRecipient.update({
        where: { id: recipientId },
        data: {
            uspsForm1583Url: formUrl,
            primaryIdUrl: id1Url,
            secondaryIdUrl: id2Url,
            status: 'PENDING_USPS',
            rejectionReason: null
        }
    });

    return NextResponse.json({ success: true, message: "Corrección enviada." });

  } catch (error) {
    console.error("KYC Fix Upload Error:", error);
    return NextResponse.json({ error: "Error procesando corrección." }, { status: 500 });
  }
}