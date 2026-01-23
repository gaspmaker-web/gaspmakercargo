import { NextResponse } from "next/server";
import { auth } from "@/auth"; 
import prisma from "@/lib/prisma"; 
import { v2 as cloudinary } from 'cloudinary';

// 1. Configuración de Cloudinary (CORREGIDA)
cloudinary.config({
  // 🔥 AQUÍ ESTABA EL ERROR: Usamos el nombre exacto de tu .env
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    // 2. Verificar Sesión
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 3. Obtener el archivo
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
    }

    // 4. Convertir a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5. Subir a Cloudinary
    const uploadResult: any = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "gmc_avatars", 
          resource_type: "image",
          transformation: [
            { width: 300, height: 300, crop: "fill", gravity: "face" }, 
            { quality: "auto" },
            { fetch_format: "auto" }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    const newImageUrl = uploadResult.secure_url;

    // 6. Guardar en Base de Datos
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: newImageUrl },
    });

    return NextResponse.json({ 
        success: true, 
        url: newImageUrl,
        message: "Avatar actualizado correctamente" 
    });

  } catch (error) {
    console.error("Error en update-avatar:", error);
    return NextResponse.json({ error: "Error interno al subir la imagen" }, { status: 500 });
  }
}