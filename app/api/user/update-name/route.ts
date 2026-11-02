import { getMobileUser } from '@/lib/getMobileUser';
import { NextResponse } from "next/server";

// 👇 VACUNA 1: Forzar modo dinámico (Vital para evitar el error de Build)
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    console.log("API: Recibida solicitud POST para /api/user/update-name");

    try {
        // 👇 VACUNA 2: Imports dentro de la función (Lazy Loading)
        // Esto evita que Vercel intente conectar la DB durante la construcción
        const prisma = (await import("@/lib/prisma")).default;
        
        // --- CAMBIO DE NEXTAUTH v5 ---
        // 1. Importa 'auth' dinámicamente
        const { auth } = await import('@/auth');
        const session = await auth();
        const mobileUser = await getMobileUser(req);
        const userId = session?.user?.id || mobileUser?.id;
        if (!userId) {
            return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
        }
        
        // 3. Obtener el nuevo nombre del cuerpo de la solicitud
        const { name } = await req.json();
        if (!name || typeof name !== 'string') {
            console.error("API: Error - El nombre ('name') no se proporcionó en el body");
            return NextResponse.json({ message: 'Nombre es requerido' }, { status: 400 });
        }

        // 4. Obtener el ID de usuario de la sesión
                
        console.log(`API: Actualizando nombre para userId: ${userId} a "${name}"`);

        // 5. Actualizar la base de datos
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { name: name }, // Asume que tu campo se llama 'name'
        });

        console.log("API: Nombre actualizado en la base de datos con éxito.");

        // 6. Devolver respuesta exitosa
        return NextResponse.json({ updatedUser }, { status: 200 });

    } catch (error) {
        console.error("API: Error fatal al actualizar el nombre:", error);
        return NextResponse.json({ message: 'Error interno del servidor al actualizar el nombre', error }, { status: 500 });
    }
}



