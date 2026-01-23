import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 👇 LA CURA: Imports dentro de la función
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;

    const session = await auth();
    
    const body = await req.json();
    const { 
        packageId, 
        weightLbs, 
        lengthIn, 
        widthIn, 
        heightIn, 
        warehouseLocation,
        carrierTrackingNumber,
        receiptUrl
    } = body;

    const updatedPackage = await prisma.package.update({
      where: { id: packageId },
      data: {
        status: 'RECIBIDO_MIAMI', 
        carrierTrackingNumber: carrierTrackingNumber,
        weightLbs: parseFloat(weightLbs),
        lengthIn: parseFloat(lengthIn),
        widthIn: parseFloat(widthIn),
        heightIn: parseFloat(heightIn),
        receiptUrl: receiptUrl || null, 
        description: `(Loc: ${warehouseLocation})`, 
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, package: updatedPackage });

  } catch (error) {
    console.error("Error receiving package:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}