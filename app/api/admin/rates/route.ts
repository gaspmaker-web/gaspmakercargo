// app/api/admin/rates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { invalidateTenantRatesCache } from '@/lib/tenant-rates';

export const dynamic = 'force-dynamic';

// GET — cargar todas las tarifas del tenant
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { getTenant } = await import('@/lib/tenant');
    const tenant = await getTenant();
    if (!tenant) return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });

const tenantFull = await prisma.tenant.findUnique({
  where: { id: tenant.id },
  select: {
    easypost_api_key: true,
    stripe_publishable_key: true,
    stripe_secret_key: true,
    stripe_mailbox_basic_price_id: true,
    stripe_mailbox_premium_price_id: true,
  }
});

const rates = await prisma.tenantRate.findMany({
  where: { tenantId: tenant.id },
  orderBy: [{ concept: 'asc' }, { countryCode: 'asc' }],
});

const mailboxPriceIds = {
  stripe_mailbox_basic_price_id: tenantFull?.stripe_mailbox_basic_price_id || '',
  stripe_mailbox_premium_price_id: tenantFull?.stripe_mailbox_premium_price_id || '',
};

return NextResponse.json({ rates, apiKeys: tenantFull, mailboxPriceIds });

  } catch (error) {
    console.error('Error loading rates:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST — guardar/actualizar tarifas
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { getTenant } = await import('@/lib/tenant');
    const tenant = await getTenant();
    if (!tenant) return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });

    const body = await req.json();
    const { rates, apiKeys, mailboxPriceIds } = body;

// Upsert tarifas
if (rates && Array.isArray(rates)) {
  await prisma.$transaction(async (tx) => {
    for (const rate of rates) {
      await tx.tenantRate.upsert({
        where: {
          tenantId_concept_countryCode: {
            tenantId: tenant.id,
            concept: rate.concept,
            countryCode: rate.countryCode ?? '',
          }
        },
        update: {
          value: rate.value,
          ...(rate.textValue !== undefined && { textValue: rate.textValue }),
        },
        create: {
          tenantId: tenant.id,
          concept: rate.concept,
          countryCode: rate.countryCode ?? null,
          value: rate.value,
          ...(rate.textValue !== undefined && { textValue: rate.textValue }),
        }
      });
    }
  }, { timeout: 30000 });
}

// Actualizar API keys si vienen
if (apiKeys) {
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      ...(apiKeys.easypost_api_key !== undefined && { easypost_api_key: apiKeys.easypost_api_key }),
      ...(apiKeys.stripe_publishable_key !== undefined && { stripe_publishable_key: apiKeys.stripe_publishable_key }),
      ...(apiKeys.stripe_secret_key !== undefined && { stripe_secret_key: apiKeys.stripe_secret_key }),
    }
  });
}

// Actualizar Stripe Price IDs del buzón
if (mailboxPriceIds) {
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      ...(mailboxPriceIds.stripe_mailbox_basic_price_id !== undefined && { 
        stripe_mailbox_basic_price_id: mailboxPriceIds.stripe_mailbox_basic_price_id || null 
      }),
      ...(mailboxPriceIds.stripe_mailbox_premium_price_id !== undefined && { 
        stripe_mailbox_premium_price_id: mailboxPriceIds.stripe_mailbox_premium_price_id || null 
      }),
    }
  });
}

    // Invalidar cache Redis
    await invalidateTenantRatesCache(tenant.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error saving rates:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// DELETE — eliminar una tarifa por país
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { getTenant } = await import('@/lib/tenant');
    const tenant = await getTenant();
    if (!tenant) return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });

  const { concept, countryCode } = await req.json();

await prisma.tenantRate.deleteMany({
  where: {
    tenantId: tenant.id,
    ...(concept ? { concept } : {}),
    countryCode: countryCode ?? null,
  }
});
    await invalidateTenantRatesCache(tenant.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting rate:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}