import { NextResponse } from "next/server";

// Vacuna
export const dynamic = 'force-dynamic';

export async function PUT(req: Request) {
  // Código temporal vacío para pasar el Build
  return NextResponse.json({ success: true, message: "Ruta en mantenimiento" });
}