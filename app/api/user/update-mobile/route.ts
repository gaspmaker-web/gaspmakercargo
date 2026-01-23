// app/api/user/update-mobile/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// --- CAMBIO DE NEXTAUTH v5 ---
// 1. Importa 'auth' desde tu archivo auth.ts en la RAÍZ (usando el alias '@/')
import { auth } from "@/auth";
// -----------------------------

export async function POST(req: Request) {
    console.log("API: Recibida solicitud POST para /api/user/update-mobile");

    try {
        // --- CAMBIO DE NEXTAUTH v5 ---
        // 2. Obtén la sesión directamente con la función 'auth'
        const session = await auth();
        // -----------------------------

        if (!session || !session.user || !session.user.id) {
            console.error("API: Error - No hay sesión o falta user.id");
            return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
        }
        
        // 1. Obtener el nuevo teléfono
        const { phone } = await req.json(); 
        if (!phone || typeof phone !== 'string') { 
            console.error("API: Error - El teléfono ('phone') no se proporcionó en el body");
            return NextResponse.json({ message: 'Teléfono es requerido' }, { status: 400 }); 
        }

        const userId = session.user.id;
        
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

