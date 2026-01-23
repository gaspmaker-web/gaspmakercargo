import { NextResponse } from "next/server";

// 👇 VACUNA 1: Forzar modo dinámico (Para que Vercel ignore esto en el Build)
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 👇 VACUNA 2: Imports dentro de la función (Lazy Loading)
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;
    const { stripe } = await import("@/lib/stripe");

    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });

    let customerId = user.stripeCustomerId;
    let shouldCreateCustomer = !customerId;

    // 1. Verificación Robusta: Si ya tiene ID, verificamos si existe en Stripe (Test/Live)
    if (customerId) {
        try {
            const existingCustomer = await stripe.customers.retrieve(customerId);
            if (existingCustomer.deleted) {
                shouldCreateCustomer = true;
            }
        } catch (error) {
            // Si da error (ej: resource_missing), es porque el ID es de otro entorno (Live vs Test)
            console.log("El cliente no existe en Stripe, creando uno nuevo...");
            shouldCreateCustomer = true;
        }
    }

    // 2. Si no tiene ID o el ID era inválido, creamos uno nuevo
    if (shouldCreateCustomer) {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId: user.id }
      });
      
      customerId = newCustomer.id;

      // Actualizamos la base de datos con el nuevo ID válido
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId }
      });
    }

    // 3. Crear el SetupIntent con el ID garantizado
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId!,
      payment_method_types: ['card'],
    });

    return NextResponse.json({ clientSecret: setupIntent.client_secret });

  } catch (error: any) {
    console.error("Error Stripe Setup:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}