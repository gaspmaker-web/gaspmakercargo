import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getTenantStripe } from '@/lib/tenant-stripe';


export async function POST(req: Request) {
  try {
    console.log("🟢 1. Iniciando Checkout API...");
    const session = await auth();
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
// 🏢 Tenant filter
const { getTenant } = await import('@/lib/tenant');
const tenant = await getTenant();
const stripe = await getTenantStripe(process.env.TENANT_SLUG || 'gaspmaker');

    const body = await req.json();
    const { planType } = body;
    console.log("📦 Plan recibido del frontend:", planType);

 // 🏢 Leer Price IDs y precios desde tenant
    const tenantFull = await prisma.tenant.findUnique({
      where: { id: tenant?.id || '' },
      select: {
        stripe_mailbox_basic_price_id: true,
        stripe_mailbox_premium_price_id: true,
      }
    });

    const { getTenantId } = await import('@/lib/tenant-cache');
    const { getTenantRate } = await import('@/lib/tenant-rates');
    const tenantSlug = process.env.TENANT_SLUG || 'gaspmaker';
    const tenantId = await getTenantId(tenantSlug);

    const basicPrice = tenantId ? (await getTenantRate(tenantId, 'mailbox_basic_monthly')) ?? 7.99 : 7.99;
    const premiumPrice = tenantId ? (await getTenantRate(tenantId, 'mailbox_premium_monthly')) ?? 14.99 : 14.99;

    let priceId = "";
    let amountToSave = 0;
    let exactDbPlanName = "";

    if (planType === "BASIC_799" || planType === "Digital Basic") {
      priceId = tenantFull?.stripe_mailbox_basic_price_id || "price_1TBrULJwbF2jSvCs6ouoqK77";
      amountToSave = basicPrice;
      exactDbPlanName = "Digital Basic";
    } else if (planType === "PREMIUM_1499" || planType === "Premium Cargo") {
      priceId = tenantFull?.stripe_mailbox_premium_price_id || "price_1TBrV9JwbF2jSvCs8hx6RhSA";
      amountToSave = premiumPrice;
      exactDbPlanName = "Premium Cargo";
    } else {
      return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
    }

    // 2. BUSCAMOS O CREAMOS CUSTOMER
    console.log("🔍 2. Verificando Stripe Customer...");
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    let customerId = dbUser?.stripeCustomerId;

    if (!customerId) {
      const existingCustomers = await stripe.customers.list({ email: session.user.email, limit: 1 });
      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
      } else {
        const newCustomer = await stripe.customers.create({ 
          email: session.user.email,
          name: session.user.name || "Cliente GMC" 
        });
        customerId = newCustomer.id;
      }
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerId }
      });
    }

    // 3. CREAMOS SUSCRIPCIÓN EN STRIPE
    console.log("💳 3. Creando Suscripción...");
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }], 
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' }, 
      expand: ['latest_invoice.payment_intent'], 
    });

   // 4. EXTRAEMOS DATOS SEGUROS
    const sub: any = subscription; // Bypass temporal para TypeScript
    const currentPeriodEnd = new Date(sub.current_period_end * 1000);
    const invoice: any = sub.latest_invoice;
    const paymentIntent: any = invoice.payment_intent;

    if (!paymentIntent || typeof paymentIntent === 'string') {
        throw new Error("El PaymentIntent no se expandió correctamente.");
    }

    const clientSecret = paymentIntent.client_secret;
    if (!clientSecret) throw new Error("No se pudo generar el client_secret");

    console.log("💾 4. Guardando en Supabase...");

    // 🔥 5. GUARDADO BLINDADO (Sin usar Upsert)
    const existingSub = await prisma.mailboxSubscription.findFirst({
        where: { userId: session.user.id }
    });

    if (existingSub) {
        console.log("🔄 Actualizando suscripción existente...");
        await prisma.mailboxSubscription.update({
            where: { id: existingSub.id },
            data: {
                planType: exactDbPlanName,
                stripeSubscriptionId: subscription.id,
                currentPeriodEnd: currentPeriodEnd,
                status: "PENDING_PAYMENT"
            }
        });
    } else {
        console.log("➕ Creando nueva suscripción...");
        await prisma.mailboxSubscription.create({
            data: {
                userId: session.user.id,
                tenant_id: tenant?.id || null,  // ← AÑADIR
                planType: exactDbPlanName,
                stripeSubscriptionId: subscription.id,
                currentPeriodEnd: currentPeriodEnd,
                status: "PENDING_PAYMENT"
            }
        });
    }

    console.log("📝 Creando transacción...");
    await prisma.mailboxTransaction.create({
        data: {
            userId: session.user.id,
            amount: amountToSave, 
            description: exactDbPlanName === "Digital Basic" ? "SUSCRIPCIÓN BUZÓN BÁSICO" : "SUSCRIPCIÓN BUZÓN PREMIUM",
            stripePaymentId: paymentIntent.id,
            status: "PENDIENTE" 
        }
    });

    console.log("✅ 5. Todo guardado correctamente. Abriendo modal.");
    return NextResponse.json({ clientSecret, subscriptionId: subscription.id });

  } catch (error: any) {
    // 🔥 AQUÍ ATRAPAREMOS EL ERROR REAL
    console.error("❌ [ERROR CRÍTICO STRIPE/PRISMA]:", error);
    return NextResponse.json({ error: error.message || "Error interno procesando el pago" }, { status: 500 });
  }
}