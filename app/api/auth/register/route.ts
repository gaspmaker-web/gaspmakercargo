import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma"; 
import { generateLockerNumber } from "@/lib/utils"; 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Ya no esperamos day/month/year por separado, sino dateOfBirth directo
    const { email, password, name, countryCode, phone, dateOfBirth } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ message: "Faltan datos obligatorios" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: "El correo ya está registrado" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const country = countryCode || 'US';
    const suiteNo = generateLockerNumber(country);

    // Convertimos el string ISO a objeto Date de JS
    // Si el string viene vacío o inválido, esto será null, pero el frontend ya valida que no esté vacío.
    const finalDate = dateOfBirth ? new Date(dateOfBirth) : null;

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password_hash: hashedPassword,
        suiteNo,
        role: "CLIENTE",
        countryCode: country,
        phone,
        dateOfBirth: finalDate // Guardado directo y limpio
      },
    });

    return NextResponse.json(
      { message: "Usuario creado con éxito", user: newUser },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Error en registro:", error);
    return NextResponse.json(
      { message: "Ocurrió un error en el servidor", error: error.message },
      { status: 500 }
    );
  }
}












