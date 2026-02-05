import { NextResponse } from "next/server";

// 👇 VACUNA 1: Forzar modo dinámico (Esto soluciona el problema del caché de Vercel)
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 👇 VACUNA 2: Imports dentro de la función (Lazy Loading)
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;
    const Stripe = (await import("stripe")).default;

    // ✅ CORRECCIÓN SEGURIDAD: Usamos process.env (GitHub ya no bloqueará esto).
    // Gracias a 'force-dynamic', Vercel leerá la llave 'sk_live_...' correctamente.
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { 
        apiVersion: "2024-12-18.acacia" as any, // Sincronizado con tu lib/stripe.ts
        typescript: true,
    });

    const session = await auth();
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    // 1. Buscar usuario en Base de Datos
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, stripeCustomerId: true, email: true, name: true }
    });

    if (!user) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }

    let customerId = user.stripeCustomerId;

    // 2. AUTO-CURACIÓN AVANZADA: 
    // Detectamos si el ID guardado es inválido o pertenece a Test Mode.
    let shouldCreateCustomer = !customerId;

    if (customerId) {
        try {
            // Intentamos leer el cliente en Stripe LIVE
            const existingCustomer = await stripe.customers.retrieve(customerId);
            
            // Si el cliente fue borrado en Stripe, marcamos para crear uno nuevo
            if (existingCustomer.deleted) {
                shouldCreateCustomer = true;
            }
        } catch (error) {
            // 🚨 IMPORTANTE: Si da error aquí, es porque el ID 'cus_...' es de TEST
            // y no existe en LIVE. Entonces forzamos la creación de uno nuevo.
            console.log("El cliente antiguo no existe en Live (era de Test). Creando nuevo...");
            shouldCreateCustomer = true;
        }
    }

    // 3. Crear cliente nuevo si hace falta (Limpieza de base de datos)
    if (shouldCreateCustomer) {
        const newCustomer = await stripe.customers.create({
            email: user.email,
            name: user.name || "Cliente GaspMaker",
            metadata: { userId: user.id }
        });

        // Actualizamos la base de datos con el nuevo ID válido (Live)
        await prisma.user.update({
            where: { id: user.id },
            data: { stripeCustomerId: newCustomer.id }
        });

        customerId = newCustomer.id;
    }

    // 4. Crear el SetupIntent (Permiso para guardar tarjeta)
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId!,
      payment_method_types: ['card'],
      usage: 'off_session', 
    });

    return NextResponse.json({ clientSecret: setupIntent.client_secret });

  } catch (error: any) {
    console.error("Error creating setup intent:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}