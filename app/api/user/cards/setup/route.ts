import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;
    const Stripe = (await import("stripe")).default;

    // Leemos la llave directamente desde el entorno (.env o .env.local).
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    // 🕵️‍♂️ EL CHISMOSO DEL BACKEND: Imprime los primeros 12 caracteres de la llave en tu terminal de VS Code
    console.log("🕵️‍♂️ CHISMOSO BACKEND - Llave secreta detectada:", stripeKey ? stripeKey.substring(0, 12) + "..." : "¡NINGUNA LLAVE!");

    if (!stripeKey) {
        console.error("❌ ERROR: No se encontró STRIPE_SECRET_KEY en las variables de entorno.");
        return NextResponse.json({ message: "Error interno de configuración de pagos" }, { status: 500 });
    }

    // Inicializamos Stripe de forma limpia y profesional
    const stripe = new Stripe(stripeKey, { 
        apiVersion: "2024-12-18.acacia" as any, 
        typescript: true,
    });

    const session = await auth();
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, stripeCustomerId: true, email: true, name: true }
    });

    if (!user) return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });

    let customerId = user.stripeCustomerId;
    let shouldCreateCustomer = !customerId;

    // Verificación de cliente existente
    if (customerId) {
        try {
            const existingCustomer = await stripe.customers.retrieve(customerId);
            if (existingCustomer.deleted) shouldCreateCustomer = true;
        } catch (error) {
            console.log("⚠️ Cliente antiguo inválido. Creando nuevo...");
            shouldCreateCustomer = true;
        }
    }

    // Crear cliente si es necesario
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

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId!,
      payment_method_types: ['card'],
      usage: 'off_session', 
    });

    return NextResponse.json({ clientSecret: setupIntent.client_secret });

  } catch (error: any) {
    console.error("🔥 Error en setup de tarjeta:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}