import { NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const mailItemId = formData.get("mailItemId") as string;
    const file = (formData.get("file") || formData.get("pdf")) as File;

    if (!mailItemId || !file || mailItemId === "undefined") {
      return NextResponse.json({ error: "Faltan datos obligatorios (ID o Archivo)" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo es muy pesado. Máximo 10MB." }, { status: 400 });
    }

    const filename = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || "application/octet-stream";
    const publicUrl = await uploadToR2(buffer, `scans/${mailItemId}/${filename}`, contentType);

    await prisma.mailItem.update({
      where: { id: mailItemId },
      data: {
        scannedDocUrl: publicUrl,
        status: "SCANNED_READY"
      }
    });

    revalidatePath('/', 'layout');

    return NextResponse.json({ success: true, url: publicUrl });

  } catch (error: any) {
    console.error("❌ Error crítico en subida de escaneo:", error);
    return NextResponse.json({ error: "Fallo interno al procesar el documento" }, { status: 500 });
  }
}
