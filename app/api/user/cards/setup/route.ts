import { NextResponse } from "next/server";

// ✅ FUERZA bruta para evitar caché
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;
    const Stripe = (await import("stripe")).default;

    // 🔍 DEBUG PROFESIONAL: ¿Qué clave está viendo Vercel realmente?
    // Esto imprimirá "sk_live..." o "sk_test..." en los logs de Vercel.
    const secretKey = process.env.STRIPE_SECRET_KEY || "";
    console.log("🔍 VERCEL ESTÁ USANDO ESTA KEY: ", secretKey.substring(0, 8) + "...");

    // Si no hay key, lanzamos error antes de intentar nada
    if (!secretKey || !secretKey.startsWith("sk_live")) {
        console.error("🚨 ERROR CRÍTICO: La clave en Vercel NO es sk_live o no existe.");
    }

    // ✅ Usamos la variable de entorno estándar
    const stripe = new Stripe(secretKey, { 
        apiVersion: "2024-12-18.acacia" as any, 
        typescript: true,
    });

    const session = await auth();
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    // 1. Buscar usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, stripeCustomerId: true, email: true, name: true }
    });

    if (!user) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }

    let customerId = user.stripeCustomerId;
    let shouldCreateCustomer = !customerId;

    // 2. Auto-Curación: Validar si el cliente existe en LIVE
    if (customerId) {
        try {
            const existingCustomer = await stripe.customers.retrieve(customerId);
            if (existingCustomer.deleted) shouldCreateCustomer = true;
        } catch (error) {
            console.log("⚠️ Cliente no encontrado en Stripe Live. Generando uno nuevo...");
            shouldCreateCustomer = true;
        }
    }

    // 3. Crear cliente si es necesario
    if (shouldCreateCustomer) {
        const newCustomer = await stripe.customers.create({
            email: user.email,
            name: user.name || "Cliente GaspMaker",
            metadata: { userId: user.id }
        });

        await prisma.user.update({
            where: { id: user.id },
            data: { stripeCustomerId: newCustomer.id }
        });
        customerId = newCustomer.id;
    }

    // 4. Crear SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId!,
      payment_method_types: ['card'],
      usage: 'off_session', 
    });

    return NextResponse.json({ clientSecret: setupIntent.client_secret });

  } catch (error: any) {
    console.error("🔥 Error en SetupIntent:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}