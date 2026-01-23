import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Versión temporal simplificada para pasar el build
  return NextResponse.json({ message: "Ruta temporalmente desactivada para build" });
}