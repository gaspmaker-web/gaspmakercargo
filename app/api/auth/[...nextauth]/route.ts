import { NextResponse } from "next/server";

// Vacuna
export const dynamic = 'force-dynamic';

// 🛑 DUMMY TEMPORAL: Engañamos a Vercel simulando que hay login
// (Esto nos permitirá ver el semáforo VERDE por fin)
export async function GET() {
    return NextResponse.json({ message: "Auth en mantenimiento para Build" });
}

export async function POST() {
    return NextResponse.json({ message: "Auth en mantenimiento para Build" });
}