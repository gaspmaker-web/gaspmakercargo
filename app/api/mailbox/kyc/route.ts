import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { uploadToR2 } from '@/lib/r2';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await req.formData();
    const additionalDataString = formData.get('additionalData') as string;
    let parsedData: any[] = [];
    
    if (additionalDataString) {
      parsedData = JSON.parse(additionalDataString);
    }

    const subscription = await prisma.mailboxSubscription.findUnique({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { additionalRecipients: true } 
        }
      }
    });

    if (!subscription) {
      return NextResponse.json({ error: "No se encontró un plan de buzón activo." }, { status: 404 });
    }

    const currentCount = subscription._count.additionalRecipients;
    const newCount = parsedData.length;
    const totalProjected = currentCount + newCount; 

    if (subscription.planType === "Digital Basic" && totalProjected > 1) {
      return NextResponse.json({ 
        error: `Límite excedido. Tu plan Digital Basic solo permite 1 persona adicional. (Ya tienes ${currentCount} registradas).` 
      }, { status: 403 }); 
    }

    if (subscription.planType === "Premium Cargo" && totalProjected > 5) {
      return NextResponse.json({ 
        error: `Límite excedido. Tu plan Premium Cargo permite hasta 5 personas adicionales. (Ya tienes ${currentCount} registradas).` 
      }, { status: 403 });
    }

    const primaryForm = formData.get('primary_form1583') as File | null;
    const primaryId1 = formData.get('primary_id1') as File | null;
    const primaryId2 = formData.get('primary_id2') as File | null;

    const uploadFile = async (file: File, folder: string) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
      return await uploadToR2(buffer, `${folder}/${Date.now()}-${safeName}`, file.type);
    };

    const updateData: any = {};

    if (primaryForm && primaryId1 && primaryId2) {
      updateData.uspsForm1583Url = await uploadFile(primaryForm, 'kyc_documents');
      updateData.primaryIdUrl = await uploadFile(primaryId1, 'kyc_documents');
      updateData.secondaryIdUrl = await uploadFile(primaryId2, 'kyc_documents');
      updateData.status = 'PENDING_USPS'; 
      updateData.rejectionReason = null;  
    }

    let additionalRecipientsData: any[] = [];
    
    if (parsedData.length > 0) {
      for (const person of parsedData) {
        const formFile = formData.get(`add_${person.id}_form1583`) as File;
        const id1File = formData.get(`add_${person.id}_id1`) as File;
        const id2File = formData.get(`add_${person.id}_id2`) as File;

        if (formFile && id1File && id2File) {
          additionalRecipientsData.push({
            fullName: person.fullName,
            uspsForm1583Url: await uploadFile(formFile, 'kyc_documents'),
            primaryIdUrl: await uploadFile(id1File, 'kyc_documents'),
            secondaryIdUrl: await uploadFile(id2File, 'kyc_documents'),
            status: 'PENDING_USPS'
          });
        }
      }
    }

    if (additionalRecipientsData.length > 0) {
      updateData.additionalRecipients = {
        create: additionalRecipientsData
      };
    }

    if (Object.keys(updateData).length === 0) {
       return NextResponse.json({ error: "No se enviaron documentos válidos para actualizar." }, { status: 400 });
    }

    await prisma.mailboxSubscription.update({
      where: { userId: session.user.id },
      data: updateData
    });

    return NextResponse.json({ success: true, message: "Documentos recibidos con éxito." });

  } catch (error) {
    console.error("KYC Upload Error:", error);
    return NextResponse.json({ error: "Error procesando los documentos en el servidor." }, { status: 500 });
  }
}
