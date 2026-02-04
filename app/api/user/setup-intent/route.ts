import { NextResponse } from "next/server";
import Stripe from "stripe"; // 👈 Importamos la CLASE, no la instancia

// 👇 Forzar que esta ruta siempre se ejecute en vivo (sin caché)
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 1. Imports de base de datos y sesión
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;

    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    // 🕵️‍♂️ DIAGNÓSTICO DE SEGURIDAD:
    // Imprimimos en los logs de Vercel qué tipo de llave está usando el sistema.
    // (Solo muestra los primeros 7 caracteres para no revelar el secreto)
    const currentKey = process.env.STRIPE_SECRET_KEY || "NO_KEY";
    console.log("🔑 INTENTO DE SETUP - USANDO LLAVE:", currentKey.substring(0, 7) + "...");

    // 🚨 SOLUCIÓN: Inicializamos Stripe AQUÍ MISMO.
    // Esto garantiza que usa la variable de entorno ACTUAL (Live), ignorando cualquier caché viejo.
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-12-18.acacia' as any, // Tu versión exacta
      typescript: true,
    });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });

    let customerId = user.stripeCustomerId;
    let shouldCreateCustomer = !customerId;

    // 2. Verificar si el cliente existente es válido en el entorno actual (Live)
    if (customerId) {
        try {
            const existingCustomer = await stripe.customers.retrieve(customerId);
            // Si el cliente fue borrado, marcamos para crear uno nuevo
            if (existingCustomer.deleted) {
                shouldCreateCustomer = true;
            }
        } catch (error) {
            // Si da error (ej: el ID 'cus_test...' no existe en Live), creamos uno nuevo
            console.log("⚠️ El cliente antiguo no existe en este entorno (Live/Test). Creando nuevo...");
            shouldCreateCustomer = true;
        }
    }

    // 3. Crear cliente nuevo si hace falta
    if (shouldCreateCustomer) {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId: user.id }
      });
      
      customerId = newCustomer.id;

      // Guardar el nuevo ID en la base de datos
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId }
      });
    }

    // 4. Crear el SetupIntent (Permiso para guardar tarjeta)
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId!,
      payment_method_types: ['card'],
    });

    return NextResponse.json({ clientSecret: setupIntent.client_secret });

  } catch (error: any) {
    console.error("❌ Error Stripe Setup:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}