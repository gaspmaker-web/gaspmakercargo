import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    // Solo Admin o Warehouse pueden tocar esto
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE')) {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    const { packageId, newStatus } = await req.json();

    const updated = await prisma.package.update({
      where: { id: packageId },
      data: { 
          status: newStatus,
          updatedAt: new Date() // Actualizamos la fecha para saber cuándo llegó
      }
    });

    return NextResponse.json({ success: true, pkg: updated });
  } catch (error) {
    console.error("Error update status:", error);
    return NextResponse.json({ message: "Error al actualizar" }, { status: 500 });
  }
}