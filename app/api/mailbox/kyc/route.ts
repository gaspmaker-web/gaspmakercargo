import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { getMobileUser } = await import("@/lib/getMobileUser");
    const session = await auth();
    const mobileUser = await getMobileUser(req.clone());
    const userId = session?.user?.id || mobileUser?.id;
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { form1583Url, id1Url, id2Url, additionalData = [] } = body;

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
      updateData.primaryIdUrl = id1Url;
      updateData.secondaryIdUrl = id2Url;
      updateData.status = 'PENDING_USPS';
      updateData.rejectionReason = null;
    }

    if (additionalData.length > 0) {
      updateData.additionalRecipients = {
        create: additionalData.map((p: any) => ({
          fullName: p.fullName,
          uspsForm1583Url: p.form1583Url,
          primaryIdUrl: p.id1Url,
          secondaryIdUrl: p.id2Url,
          status: 'PENDING_USPS'
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
    console.error("KYC Upload Error:", error);
    return NextResponse.json({ error: "Error procesando los documentos en el servidor." }, { status: 500 });
  }
}
