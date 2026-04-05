import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache"; // 🔥 IMPORTANTE: Refresca el Sidebar

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const mailItemId = formData.get("mailItemId") as string;
    
    // Soporta tanto la versión antigua ("pdf") como la nueva ("file")
    const file = (formData.get("file") || formData.get("pdf")) as File;

    if (!mailItemId || !file || mailItemId === "undefined") {
      return NextResponse.json({ error: "Faltan datos obligatorios (ID o Archivo)" }, { status: 400 });
    }

    // Límite de 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo es muy pesado. Máximo 10MB." }, { status: 400 });
    }

    const filename = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    
    // Subida segura a Vercel Blob
    const blob = await put(`scans/${mailItemId}/${filename}`, file, {
      access: "public",
      addRandomSuffix: true,
    });

    // Actualiza la base de datos (Usando scannedDocUrl)
    await prisma.mailItem.update({
      where: { id: mailItemId },
      data: {
        scannedDocUrl: blob.url,
        status: "SCANNED_READY"
      }
    });

    // 🔥 MAGIA: Le avisamos a Next.js que actualice el Sidebar y limpie la tarea
    revalidatePath('/', 'layout');

    return NextResponse.json({ success: true, url: blob.url });

  } catch (error: any) {
    console.error("❌ Error crítico en subida de escaneo:", error);
    return NextResponse.json({ error: "Fallo interno al procesar el documento" }, { status: 500 });
  }
}