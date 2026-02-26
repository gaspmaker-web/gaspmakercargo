import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    // ✅ FORMA CORRECTA: Leemos de Vercel + Limpiamos espacios invisibles
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    // 🕵️‍♂️ EL CHISMOSO DEL BACKEND: ¡Que confiese la llave!
    console.log("🕵️‍♂️ SETUP-INTENT leyendo llave secreta:", stripeKey ? stripeKey.substring(0, 12) + "..." : "¡NINGUNA LLAVE!");

    if (!stripeKey) {
        throw new Error("La clave de Stripe no está configurada en Vercel");
    }

    // ✂️ El .trim() es vital para evitar el error "Invalid character in header"
    const stripe = new Stripe(stripeKey.trim(), {
      apiVersion: '2024-12-18.acacia' as any,
      typescript: true,
    });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    
    if (!user) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }

    let customerId = user.stripeCustomerId;
    let buildCustomer = !customerId;

    // 1. Validar cliente existente
    if (customerId) {
        try {
            const existingCustomer = await stripe.customers.retrieve(customerId);
            if (existingCustomer.deleted) buildCustomer = true;
        } catch (error) {
            console.log("⚠️ Cliente antiguo no válido. Creando nuevo...");
            buildCustomer = true;
        }
    }

    // 2. Crear cliente nuevo si hace falta
    if (buildCustomer) {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        name: user.name || "Cliente GaspMaker",
        metadata: { userId: user.id }
      });
      
      customerId = newCustomer.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId }
      });
    }

    // 3. Crear SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId!,
      payment_method_types: ['card'],
      usage: 'off_session', 
    });

    return NextResponse.json({ clientSecret: setupIntent.client_secret });

  } catch (error: any) {
    console.error("🔥 Error Stripe:", error.message);
    return NextResponse.json({ message: "Error procesando el pago" }, { status: 500 });
  }
}