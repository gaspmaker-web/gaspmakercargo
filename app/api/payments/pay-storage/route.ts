import { NextResponse } from "next/server";

// 👇 VACUNA 1: Forzar modo dinámico
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 👇 VACUNA 2: Imports e Inicialización dentro de la función (Lazy Loading)
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;
    const { sendPaymentReceiptEmail } = await import('@/lib/notifications');
    const Stripe = (await import("stripe")).default;

    // 🚨 Instancia de Stripe protegida dentro de la función
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2024-06-20' as any,
    });

   const session = await auth();
if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    // 🏢 Tenant filter
    const { getTenant } = await import('@/lib/tenant');
    const tenant = await getTenant();

    const userId = session.user.id;
    // 1. Recibimos los datos exactos del Modal (Paquete y Tarjeta seleccionada)
    const { packageId, paymentMethodId, amount } = await req.json();

    if (!packageId || !paymentMethodId) {
        return NextResponse.json({ message: "Datos incompletos para el pago." }, { status: 400 });
    }

    // 2. Buscar el Usuario para obtener el Customer ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true, email: true, name: true }
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json({ message: "Configuración de pago no encontrada." }, { status: 400 });
    }

    // 3. Buscar el PAQUETE ESPECÍFICO para validar la deuda real
    const pkg = await prisma.package.findUnique({
      where: { id: packageId, userId: userId }
    });

    if (!pkg) {
      return NextResponse.json({ message: "Paquete no encontrado." }, { status: 404 });
    }

    // Usamos el monto que viene del frontend o el de la base de datos (prioridad DB si existe)
    // Para storage, a veces es dinámico, así que validamos que sea mayor a 0.
    const finalAmount = pkg.storageDebt && pkg.storageDebt > 0 ? pkg.storageDebt : amount;

    console.log(`🟢 Procesando pago Storage para paquete: ${pkg.gmcTrackingNumber}`);
    console.log(`💰 Monto: $${finalAmount}`);

    if (finalAmount < 0.50) {
       // Stripe no procesa menos de 0.50, asumimos éxito interno si es micro-deuda o lanzamos error
       // En este caso lanzamos error para que no falle Stripe
       return NextResponse.json({ message: "El monto es inferior al mínimo procesable ($0.50)." }, { status: 400 });
    }

    // 4. Obtener el ID real de la tarjeta en Stripe
    const paymentMethod = await prisma.paymentMethod.findUnique({
        where: { id: paymentMethodId }
    });

    if (!paymentMethod?.stripePaymentMethodId) {
        return NextResponse.json({ message: "Método de pago inválido." }, { status: 400 });
    }

    // 5. COBRAR EN STRIPE
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalAmount * 100), // Centavos
      currency: "usd",
      customer: user.stripeCustomerId,
      payment_method: paymentMethod.stripePaymentMethodId,
      off_session: true,
      confirm: true,
      description: `Storage Fee: ${pkg.gmcTrackingNumber}`,
      metadata: {
          packageId: pkg.id,
          tracking: pkg.gmcTrackingNumber,
          type: 'STORAGE_FEE'
      }
    });

    // 6. SI EL PAGO ES EXITOSO
    if (paymentIntent.status === 'succeeded') {
      
      const now = new Date();

      // A. Actualizamos el Paquete (SOLO LA DEUDA Y FECHA)
      // ⚠️ IMPORTANTE: NO TOCAMOS EL 'status' NI 'consolidatedShipmentId'
      // Esto garantiza que el paquete se quede en "En Bodega".
      await prisma.package.update({
        where: { id: pkg.id },
        data: {
          storageDebt: 0, // Borramos la deuda
          storagePaidUntil: now // Actualizamos fecha
        }
      });

      // B. Generamos el Recibo (Respetando tu lógica de usar PickupRequest como historial)
      // Usamos estado 'PAGADO' para que quede como registro financiero.
      const historyRecord = await prisma.pickupRequest.create({
        data: {
            userId: userId,
            tenant_id: tenant?.id || null,  // ← AÑADIR
            serviceType: 'STORAGE_FEE', 
            status: 'PAGADO', // Estado final, no activo
            originAddress: 'Bodega Miami',
            originCity: 'Miami, FL',
            pickupDate: now,
            contactPhone: 'N/A',
            description: `Pago de almacenaje: ${pkg.gmcTrackingNumber}`,
            totalPaid: finalAmount,
            subtotal: finalAmount,
            processingFee: 0,
            stripePaymentId: paymentIntent.id,
            volumeInfo: `${pkg.lengthIn || 0}x${pkg.widthIn || 0}x${pkg.heightIn || 0}`, // Guardamos dimensiones de referencia
            weightInfo: `${pkg.weightLbs} lb`
        }
      });

      // C. Enviar Email
      try {
        await sendPaymentReceiptEmail(
            user.email,
            user.name || 'Cliente',
            `Almacenaje - ${pkg.gmcTrackingNumber}`,
            finalAmount,
            historyRecord.id,
            `Pago exitoso de renta de almacenaje para el paquete ${pkg.gmcTrackingNumber}.`
        );
      } catch (e) {
        console.error("⚠️ Error enviando email:", e);
      }

      return NextResponse.json({ success: true, message: "Pago realizado con éxito. Paquete liberado." });
    } else {
      return NextResponse.json({ message: "El banco rechazó la transacción." }, { status: 400 });
    }

  } catch (error: any) {
    console.error("❌ Error en pay-storage:", error);
    return NextResponse.json({ message: error.message || "Error interno del servidor" }, { status: 500 });
  }
}