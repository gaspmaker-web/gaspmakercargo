import { getMobileUser } from '@/lib/getMobileUser';
import { NextResponse } from "next/server";

// 👇 VACUNA 1: Forzar modo dinámico
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 👇 VACUNA 2: Imports dentro de la función
    const { auth } = await import('@/auth');
        const session = await auth();
        const mobileUser = await getMobileUser(req);
        const userId = session?.user?.id || mobileUser?.id;
        if (!userId) {
            return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
        }

    const { id } = await req.json();

    // Verificamos que la dirección pertenezca al usuario antes de borrarla (Seguridad)
    const addressToDelete = await prisma.address.findUnique({
      where: { id: id }
    });

    if (!addressToDelete || addressToDelete.userId !== userId) {
      return NextResponse.json({ message: "No autorizado para eliminar" }, { status: 403 });
    }

    // Eliminamos la dirección
    await prisma.address.delete({
      where: { id: id }
    });

    return NextResponse.json({ message: "Dirección eliminada correctamente" }, { status: 200 });
  } catch (error) {
    console.error("Error eliminando dirección:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}