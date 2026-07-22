// app/api/cargoos/tenants/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const ADMIN_SECRET = process.env.CARGOOS_ADMIN_SECRET;

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function verifyAdmin(req: NextRequest) {
  const auth = req.headers.get('x-admin-secret');
  return auth === ADMIN_SECRET;
}

// GET — detalle de un tenant
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!verifyAdmin(req)) return unauthorized();

  const tenant = await prisma.tenant.findUnique({
    where: { id: params.id },
    include: { tenantPlan: true },
  });

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ tenant });
}

// PATCH — actualizar plan o status
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!verifyAdmin(req)) return unauthorized();

  try {
    const body = await req.json();
    const { plan, status, setup_paid, notes, next_billing } = body;

    const updated = await prisma.tenantPlan.update({
      where: { tenantId: params.id },
      data: {
        ...(plan && { plan }),
        ...(status && { status }),
        ...(setup_paid !== undefined && { setupPaid: setup_paid }),
        ...(notes !== undefined && { notes }),
        ...(next_billing && { nextBilling: new Date(next_billing) }),
        ...(plan && {
          monthlyPrice: plan === 'growth' ? 29900 : plan === 'pro' ? 49900 : 14900,
        }),
      },
    });

    return NextResponse.json({ plan: updated });
  } catch (error) {
    console.error('Error updating tenant plan:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// DELETE — suspender tenant (no borrar data)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!verifyAdmin(req)) return unauthorized();

  await prisma.tenantPlan.update({
    where: { tenantId: params.id },
    data: { status: 'suspended' },
  });

  return NextResponse.json({ ok: true });
}