import { getMobileUser } from '@/lib/getMobileUser';
import { NextResponse } from "next/server";

// 👇 VACUNA 1: Forzar modo dinámico
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    console.log("API: Recibida solicitud POST para /api/user/update-mobile");

    try {
        // 👇 VACUNA 2: Imports dentro de la función (Lazy Loading)
        const prisma = (await import("@/lib/prisma")).default;
        
        // --- CAMBIO DE NEXTAUTH v5 ---
        // 1. Importa 'auth' de forma dinámica
        const { auth } = await import('@/auth');
        const session = await auth();
        const mobileUser = await getMobileUser(req);
        const userId = session?.user?.id || mobileUser?.id;
        if (!userId) {
            return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
        }
        
        // 1. Obtener el nuevo teléfono
        const { phone } = await req.json(); 
        if (!phone || typeof phone !== 'string') { 
            console.error("API: Error - El teléfono ('phone') no se proporcionó en el body");
            return NextResponse.json({ message: 'Teléfono es requerido' }, { status: 400 }); 
        }

                
        console.log(`API: Actualizando teléfono para userId: ${userId} a \"${phone}\"`);

        // 2. Actualizar la base de datos
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { phone: phone }, // Asume que tu campo se llama 'phone'
        });

        console.log("API: Teléfono actualizado en la base de datos con éxito."); 

        return NextResponse.json({ updatedUser }, { status: 200 });

    } catch (error) {
        console.error("API: Error fatal al actualizar el teléfono:", error); 
        return NextResponse.json({ message: 'Error interno del servidor al actualizar el teléfono', error }, { status: 500 }); 
    }
}

