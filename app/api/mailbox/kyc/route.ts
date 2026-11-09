import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dcu36bfyt'}/image/upload`;
const UPLOAD_PRESET = 'ml_default';

async function uploadFileToCloudinary(file: File): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
    const data = await res.json();
    return data.secure_url ?? null;
  } catch { return null; }
}

export async function POST(req: Request) {
  try {
    const { getMobileUser } = await import("@/lib/getMobileUser");
    const session = await auth();
    const mobileUser = await getMobileUser(req.clone());
    const userId = session?.user?.id || mobileUser?.id;
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';

    let form1583Url: string | undefined;
    let id1Url: string | undefined;
    let id2Url: string | undefined;
    let additionalData: any[] = [];

    if (contentType.includes('application/json')) {
      // Mobile path: Cloudinary URLs already uploaded by the app
      const body = await req.json();
      form1583Url = body.form1583Url;
      id1Url = body.id1Url;
      id2Url = body.id2Url;
      additionalData = body.additionalData ?? [];
    } else {
      // Web path: raw files, upload to Cloudinary here
      const formData = await req.formData();

      const file1583 = formData.get('primary_form1583') as File | null;
      const fileId1  = formData.get('primary_id1')     as File | null;
      const fileId2  = formData.get('primary_id2')     as File | null;

      if (file1583) form1583Url = (await uploadFileToCloudinary(file1583)) ?? undefined;
      if (fileId1)  id1Url      = (await uploadFileToCloudinary(fileId1))  ?? undefined;
      if (fileId2)  id2Url      = (await uploadFileToCloudinary(fileId2))  ?? undefined;

      // Additional persons: web sends files as add_{id}_form1583 / add_{id}_id1 / add_{id}_id2
      // and additionalData JSON field with { id, fullName } entries
      const additionalRaw = formData.get('additionalData');
      const additionalMeta: { id: string; fullName: string }[] = additionalRaw
        ? JSON.parse(additionalRaw as string)
        : [];

      for (const person of additionalMeta) {
        const pFile1583 = formData.get(`add_${person.id}_form1583`) as File | null;
        const pFileId1  = formData.get(`add_${person.id}_id1`)      as File | null;
        const pFileId2  = formData.get(`add_${person.id}_id2`)      as File | null;

        const [pUrl1583, pUrlId1, pUrlId2] = await Promise.all([
          pFile1583 ? uploadFileToCloudinary(pFile1583) : null,
          pFileId1  ? uploadFileToCloudinary(pFileId1)  : null,
          pFileId2  ? uploadFileToCloudinary(pFileId2)  : null,
        ]);

        additionalData.push({
          fullName:    person.fullName,
          form1583Url: pUrl1583 ?? undefined,
          id1Url:      pUrlId1  ?? undefined,
          id2Url:      pUrlId2  ?? undefined,
        });
      }
    }

    const subscription = await prisma.mailboxSubscription.findUnique({
      where: { userId },
      include: { _count: { select: { additionalRecipients: true } } }
    });

    if (!subscription) {
      return NextResponse.json({ error: "No se encontró un plan de buzón activo." }, { status: 404 });
    }

    const currentCount = subscription._count.additionalRecipients;
    const newCount = additionalData.length;
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

    const updateData: any = {};

    if (form1583Url && id1Url && id2Url) {
      updateData.uspsForm1583Url = form1583Url;
      updateData.primaryIdUrl    = id1Url;
      updateData.secondaryIdUrl  = id2Url;
      updateData.status          = 'PENDING_USPS';
      updateData.rejectionReason = null;
    }

    if (additionalData.length > 0) {
      updateData.additionalRecipients = {
        create: additionalData.map((p: any) => ({
          fullName:        p.fullName,
          uspsForm1583Url: p.form1583Url,
          primaryIdUrl:    p.id1Url,
          secondaryIdUrl:  p.id2Url,
          status:          'PENDING_USPS',
        }))
      };
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No se enviaron documentos válidos para actualizar." }, { status: 400 });
    }

    await prisma.mailboxSubscription.update({
      where: { userId },
      data: updateData
    });

    return NextResponse.json({ success: true, message: "Documentos recibidos con éxito." });

  } catch (error) {
    console.error("KYC Upload Error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return NextResponse.json({ error: "Error procesando los documentos en el servidor." }, { status: 500 });
  }
}
