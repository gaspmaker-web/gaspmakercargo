import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

// 👇 Forzamos modo dinámico (sin caché)
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    // 🔐 LLAVE MAESTRA LIVE (Base64)
    // El error anterior ocurría porque al desencriptar quedaba un espacio invisible.
    const ENCRYPTED_KEY = "c2tfbGl2ZV81MUdsTlA1SndiRjJqU3ZDc3VKczJqNTJEUExMVE9rcDVlT0djNndxZGtwczJvdWMwU1hQYWxlOHRCR1lxNDRMZmtoempHVVZWZ09rWjdZTE5SME56U1pOrMDAwaDJQbGNyMFA=";
    
    // ✅ LA SOLUCIÓN: Agregamos .trim() al final para borrar espacios invisibles
    const SECRET_KEY_FINAL = Buffer.from(ENCRYPTED_KEY, 'base64').toString('utf-8').trim();

    // Verificación de seguridad en logs (Solo imprime el largo de la llave, no la llave)
    console.log(`🔐 Stripe Key cargada. Longitud: ${SECRET_KEY_FINAL.length} caracteres.`);

    // Inicializamos Stripe
    const stripe = new Stripe(SECRET_KEY_FINAL, {
      apiVersion: '2024-12-18.acacia' as any,
      typescript: true,
    });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    
    if (!user) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }

    let customerId = user.stripeCustomerId;
    let shouldCreateCustomer = !customerId;

    // 1. Verificar si el cliente existe en Stripe Live
    if (customerId) {
        try {
            const existingCustomer = await stripe.customers.retrieve(customerId);
            if (existingCustomer.deleted) shouldCreateCustomer = true;
        } catch (error) {
            console.log("⚠️ Cliente antiguo no válido. Creando uno nuevo...");
            shouldCreateCustomer = true;
        }
    }

    // 2. Crear cliente nuevo si hace falta
    if (shouldCreateCustomer) {
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

    // 3. Crear el permiso (SetupIntent)
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId!,
      payment_method_types: ['card'],
      usage: 'off_session', 
    });

    return NextResponse.json({ clientSecret: setupIntent.client_secret });

  } catch (error: any) {
    // Este log nos dirá si sigue fallando la conexión
    console.error("🔥 Error Stripe:", error.message); 
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}