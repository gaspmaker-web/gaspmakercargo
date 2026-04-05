import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { put } from '@vercel/blob'; 

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Leemos el formData al principio
    const formData = await req.formData();
    const additionalDataString = formData.get('additionalData') as string;
    let parsedData: any[] = [];
    
    if (additionalDataString) {
      parsedData = JSON.parse(additionalDataString);
    }

    // =========================================================================
    // 🔥 1. EL CANDADO DE SEGURIDAD ENTERPRISE (Validación de Límites)
    // =========================================================================
    
    // Buscamos la suscripción y CONTAMOS cuántos adicionales ya existen en la BD
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

    // Matemáticas de seguridad
    const currentCount = subscription._count.additionalRecipients; // Los que ya tiene guardados
    const newCount = parsedData.length; // Los que intenta guardar ahora
    const totalProjected = currentCount + newCount; 

    // Reglas de bloqueo estrictas
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

    // =========================================================================
    // 2. PROCESAMIENTO DE ARCHIVOS (Solo llega aquí si pasó el candado)
    // =========================================================================

    const primaryForm = formData.get('primary_form1583') as File | null;
    const primaryId1 = formData.get('primary_id1') as File | null;
    const primaryId2 = formData.get('primary_id2') as File | null;

    const uploadFile = async (file: File, folder: string) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
      const { url } = await put(`${folder}/${Date.now()}-${safeName}`, buffer, {
        access: 'public',
        contentType: file.type,
      });
      return url;
    };

    const updateData: any = {};

    // Si enviaron documentos nuevos del titular, los actualizamos
    if (primaryForm && primaryId1 && primaryId2) {
      updateData.uspsForm1583Url = await uploadFile(primaryForm, 'kyc_documents');
      updateData.primaryIdUrl = await uploadFile(primaryId1, 'kyc_documents');
      updateData.secondaryIdUrl = await uploadFile(primaryId2, 'kyc_documents');
      updateData.status = 'PENDING_USPS'; 
      updateData.rejectionReason = null;  
    }

    // 3. Procesar las Personas Adicionales
    let additionalRecipientsData: any[] = [];
    
    if (parsedData.length > 0) {
      for (const person of parsedData) {
        const formFile = formData.get(`add_${person.id}_form1583`) as File;
        const id1File = formData.get(`add_${person.id}_id1`) as File;
        const id2File = formData.get(`add_${person.id}_id2`) as File;

        if (formFile && id1File && id2File) {
          const formUrl = await uploadFile(formFile, 'kyc_documents');
          const id1Url = await uploadFile(id1File, 'kyc_documents');
          const id2Url = await uploadFile(id2File, 'kyc_documents');

          additionalRecipientsData.push({
            fullName: person.fullName,
            uspsForm1583Url: formUrl,
            primaryIdUrl: id1Url,
            secondaryIdUrl: id2Url,
            status: 'PENDING_USPS'
          });
        }
      }
    }

    // 4. Si hay NUEVOS familiares, los AGREGAMOS
    if (additionalRecipientsData.length > 0) {
      updateData.additionalRecipients = {
        create: additionalRecipientsData
      };
    }

    // 5. Seguro contra envíos vacíos
    if (Object.keys(updateData).length === 0) {
       return NextResponse.json({ error: "No se enviaron documentos válidos para actualizar." }, { status: 400 });
    }

    // 6. Ejecutar la actualización final en Prisma
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