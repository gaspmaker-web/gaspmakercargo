import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-11-17.clover",
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { mailItemId, action } = await req.json();

    if (!mailItemId || !action) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const [mailItem, user] = await Promise.all([
      prisma.mailItem.findUnique({ where: { id: mailItemId } }),
      prisma.user.findUnique({ 
        where: { id: session.user.id },
        include: { mailboxSubscription: true } 
      })
    ]);

    const sub = user?.mailboxSubscription;

    // 🏢 Tarifas dinámicas desde tenant_rates
const { getTenantId } = await import('@/lib/tenant-cache');
const { getTenantRate } = await import('@/lib/tenant-rates');
const tenantSlug = process.env.TENANT_SLUG || 'gaspmaker';
const tenantId = await getTenantId(tenantSlug);
const scanPrice = tenantId ? Math.round(((await getTenantRate(tenantId, 'mailbox_scan_per_envelope')) ?? 1.50) * 100) : 150;
const shredPrice = tenantId ? Math.round(((await getTenantRate(tenantId, 'mailbox_shred_per_envelope')) ?? 0.50) * 100) : 50;

    if (!mailItem || mailItem.userId !== session.user.id || !user || !sub) {
      return NextResponse.json({ error: "Sobre no encontrado" }, { status: 404 });
    }

    // 🔥 OBTENER EL INICIO DEL MES ACTUAL PARA EL LÍMITE DE 30 ESCANEOS
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const scansThisMonth = await prisma.mailItem.count({
      where: {
        userId: user.id,
        status: { in: ['SCAN_REQUESTED', 'SCANNED_READY'] },
        updatedAt: { gte: startOfMonth }
      }
    });

    const isPremium = sub.planType === "PREMIUM_1499" || sub.planType === "Premium Cargo" || sub.planType === "PREMIUM";

    let newStatus = mailItem.status;
    let priceAmount = 0; 
    let description = "";

    if (action === 'SCAN' || action === 'REQUEST_SCAN') {
      newStatus = 'SCAN_REQUESTED';
      description = `ESCANEO DE DOCUMENTO #${mailItem.id.substring(0,6).toUpperCase()}`;
      
      // 🔥 LA POLÍTICA DE USO JUSTO
      if (isPremium && scansThisMonth < 30) {
        priceAmount = 0; // ¡Aún le quedan escaneos gratis!
      } else {
        priceAmount = scanPrice; // $1.50 (Básico o Premium que superó el límite)
      }

    } else if (action === 'SHRED' || action === 'REQUEST_SHRED') {
      newStatus = 'SHRED_REQUESTED';
      description = `TRITURACIÓN SEGURA #${mailItem.id.substring(0,6).toUpperCase()}`;
      priceAmount = isPremium ? 0 : shredPrice; // La trituración sigue siendo ilimitada para Premium
    } else if (action === 'MOVE_TO_CARGO' || action === 'CARGO') {
      newStatus = 'CARGO_REQUESTED'; 
      priceAmount = 0;
    }

    // COBRO EN STRIPE SI APLICA
    if (priceAmount > 0) {
      if (!user.stripeCustomerId) {
        return NextResponse.json({ error: "No hay método de pago registrado" }, { status: 402 });
      }

      await stripe.invoiceItems.create({
        customer: user.stripeCustomerId,
        amount: priceAmount,
        currency: 'usd',
        description: description,
      });

      await prisma.mailboxTransaction.create({
        data: {
          userId: user.id,
          amount: priceAmount / 100,
          description: description,
          status: "COMPLETADO" 
        }
      });
    }

    await prisma.mailItem.update({
      where: { id: mailItemId },
      data: { status: newStatus }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error procesando acción:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}