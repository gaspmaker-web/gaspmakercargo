// app/api/user/update-profile/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// --- CAMBIO DE NEXTAUTH v5 ---
// 1. Importa 'auth' desde tu archivo auth.ts en la RAÍZ (usando el alias '@/')
import { auth } from "@/auth";
// -----------------------------

export async function PATCH(req: Request) {
  try {
    // --- CAMBIO DE NEXTAUTH v5 ---
    // 2. Obtén la sesión directamente con la función 'auth'
    const session = await auth();
    // -----------------------------
    
    // 3. PASO DE SEGURIDAD: Obtener el ID del usuario autenticado
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: "No autenticado." }, { status: 401 });
    }
    const userId = session.user.id; // <-- Usamos el ID de la sesión

    const body = await req.json();
    const { 
        name, 
        phone, 
        dateOfBirth, 
        address, 
        cityZip, 
        country
    } = body;
    
    // 4. Crear el objeto de datos a actualizar
    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (cityZip) updateData.cityZip = cityZip;
    if (country) updateData.country = country;
    
    // 5. Manejar la fecha de nacimiento
    if (dateOfBirth) {
        // Convierte la cadena de fecha a un objeto Date para Prisma
        updateData.dateOfBirth = new Date(dateOfBirth);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No se proporcionaron datos para actualizar." }, { status: 400 });
    }
    
    // 6. Actualizar el usuario usando su ID de sesión
    const updatedUser = await prisma.user.update({
      where: { id: userId }, // <-- Actualizado
      data: updateData,
      select: { // Devolver solo los campos que importan
        name: true, 
        email: true, 
        phone: true, 
        dateOfBirth: true,
        address: true,
      }
    });

    return NextResponse.json({ 
        message: "Perfil actualizado con éxito.",
        user: updatedUser
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error al actualizar el perfil:", error.message);
    return NextResponse.json({ message: "Error interno del servidor." }, { status: 500 });
  }
}