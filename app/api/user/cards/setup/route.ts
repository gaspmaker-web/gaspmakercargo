import { NextResponse } from "next/server";

// 👇 VACUNA 1: Forzar modo dinámico (Para evitar errores de Build)
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 👇 VACUNA 2: Imports e Inicialización dentro de la función (Lazy Loading)
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;
    const Stripe = (await import("stripe")).default;

    // 🚨 Instancia de Stripe protegida dentro de la función
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { 
        apiVersion: "2024-06-20" as any 
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

    // 2. AUTO-CURACIÓN: Si no tiene ID de Stripe, lo creamos ahora mismo
    if (!customerId) {
        console.log(`Usuario ${user.email} sin Stripe ID. Creando uno nuevo...`);
        
        const newCustomer = await stripe.customers.create({
            email: user.email,
            name: user.name || "Cliente GaspMaker",
            metadata: { userId: user.id }
        });

        // Guardamos el nuevo ID en la base de datos para el futuro
        await prisma.user.update({
            where: { id: user.id },
            data: { stripeCustomerId: newCustomer.id }
        });

        customerId = newCustomer.id;
    }

    // 3. Crear SetupIntent (Permiso para guardar tarjeta)
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session', 
    });

    return NextResponse.json({ clientSecret: setupIntent.client_secret });

  } catch (error: any) {
    console.error("Error creating setup intent:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}