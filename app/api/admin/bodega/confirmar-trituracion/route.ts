import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    // 🛡️ Filtro de seguridad: Solo personal autorizado de bodega (Admin/Superadmin)
    if (!session?.user?.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: "Acceso denegado. Se requiere nivel de Administrador." }, { status: 403 });
    }

    const { mailItemId } = await request.json();

    if (!mailItemId) {
      return NextResponse.json({ error: "Falta el ID del sobre" }, { status: 400 });
    }

    // Actualizamos el estado del sobre a "SHREDDED" (Triturado)
    await prisma.mailItem.update({
      where: { id: mailItemId },
      data: { status: "SHREDDED" }
    });

    return NextResponse.json({ success: true, message: "Sobre marcado como destruido permanentemente" });

  } catch (error) {
    console.error("❌ Error en confirmación de trituración:", error);
    return NextResponse.json({ error: "Fallo interno al procesar la solicitud" }, { status: 500 });
  }
}