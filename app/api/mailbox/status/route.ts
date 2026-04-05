import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 
import { auth } from "@/auth"; 

export async function GET(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        mailboxSubscription: {
          include: {
            additionalRecipients: true 
          }
        },
        mailItems: {
          where: { status: "UNREAD" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const subscription = user.mailboxSubscription;

    if (!subscription) {
      return NextResponse.json({ 
        hasPlan: false, 
        message: "No subscription found" 
      }, { status: 200 });
    }

    const hasUploadedMainDocs = !!subscription.uspsForm1583Url; 
    const additionalPeopleCount = subscription.additionalRecipients?.length || 0; 

    const hasActiveAdditional = subscription.additionalRecipients?.some(
      (person) => person.status === "ACTIVE"
    ) || false;

    // Calculamos el Estado Efectivo (Para el buzón)
    let effectiveStatus = subscription.status;
    if (effectiveStatus !== "ACTIVE" && hasActiveAdditional) {
      effectiveStatus = "ACTIVE";
    }

    if (effectiveStatus === "PENDING_USPS" || effectiveStatus === "REJECTED") {
      return NextResponse.json({
        hasPlan: true,
        status: effectiveStatus, 
        titularStatus: subscription.status, // 🔥 EL ESTADO LEGAL ESTRICTO DEL TITULAR
        planType: subscription.planType, 
        hasUploadedMainDocs, 
        additionalPeopleCount, 
        message: hasUploadedMainDocs ? "Documents in review" : "Action required"
      }, { status: 200 });
    }

    return NextResponse.json({
      hasPlan: true,
      status: effectiveStatus, 
      titularStatus: subscription.status, // 🔥 EL ESTADO LEGAL ESTRICTO DEL TITULAR
      planType: subscription.planType,
      unreadCount: user.mailItems.length,
      hasUploadedMainDocs,
      additionalPeopleCount,
      message: "Active mailbox"
    }, { status: 200 });

  } catch (error) {
    console.error("[MAILBOX_STATUS_ERROR]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}