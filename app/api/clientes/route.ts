import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(req: Request) {
  const session = await auth();

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE')) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');

  if (!query || query.length < 3) {
    return NextResponse.json({ message: "Escribe al menos 3 caracteres" }, { status: 400 });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          // CAMBIO AQUÍ: Usamos 'startsWith' para el email.
          // Así 'd@gmail.com' NO encontrará 'dd@gmail.com', pero sí 'd@gmail.com'
          { email: { startsWith: query, mode: 'insensitive' } },
          
          // Para nombre y casillero mantenemos 'contains' (más flexible)
          // Así si buscas "Gerardo", encuentra "Gerardo Soler"
          { name: { contains: query, mode: 'insensitive' } },
          { suiteNo: { contains: query, mode: 'insensitive' } },
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        suiteNo: true,
        countryCode: true
      },
      take: 5
    });

    if (users.length === 0) {
      return NextResponse.json({ message: "Cliente no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ 
      client: users[0], 
      users: users 
    });

  } catch (error) {
    console.error("Error buscando cliente:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}