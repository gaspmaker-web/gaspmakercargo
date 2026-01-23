// app/api/user/update-name/route.ts
import prisma from "@/lib/prisma"; 
import { NextResponse } from "next/server";

// --- CAMBIO DE NEXTAUTH v5 ---
// 1. Importa 'auth' desde tu archivo auth.ts en la RAÍZ (usando el alias '@/')
import { auth } from "@/auth";
// -----------------------------

export async function POST(req: Request) {
    console.log("API: Recibida solicitud POST para /api/user/update-name");

    try {
        // --- CAMBIO DE NEXTAUTH v5 ---
        // 2. Obtén la sesión directamente con la función 'auth'
        const session = await auth();
        // -----------------------------

        // 2. Seguridad: Verificar si el usuario está autenticado
        if (!session || !session.user || !session.user.id) {
            console.error("API: Error - No hay sesión o falta user.id");
            return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
        }
        
        // 3. Obtener el nuevo nombre del cuerpo de la solicitud
        const { name } = await req.json();
        if (!name || typeof name !== 'string') {
            console.error("API: Error - El nombre ('name') no se proporcionó en el body");
            return NextResponse.json({ message: 'Nombre es requerido' }, { status: 400 });
        }

        // 4. Obtener el ID de usuario de la sesión
        const userId = session.user.id;
        
        console.log(`API: Actualizando nombre para userId: ${userId} a \"${name}\"`);

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




