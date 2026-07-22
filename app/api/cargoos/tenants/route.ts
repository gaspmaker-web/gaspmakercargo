// app/api/cargoos/tenants/route.ts
// Panel admin CargoOS — solo accesible con CARGOOS_ADMIN_SECRET

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

// GET — lista todos los tenants con su plan
export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) return unauthorized();

  const tenants = await prisma.tenant.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      tenantPlan: true,
    },
    select: {
      id: true,
      company_name: true,
      slug: true,
      custom_domain: true,
      owner_name: true,
      owner_email: true,
      owner_phone: true,
      created_at: true,
      tenantPlan: true,
    },
  });

  return NextResponse.json({ tenants });
}

// POST — crear nuevo tenant + plan
export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) return unauthorized();

  try {
    const body = await req.json();
    const {
      company_name,
      slug,
      custom_domain,
      owner_name,
      owner_email,
      owner_phone,
      primary_color,
      secondary_color,
      plan,
      setup_paid,
    } = body;

    // Validación mínima
    if (!company_name || !slug || !owner_email) {
      return NextResponse.json(
        { error: 'company_name, slug y owner_email son requeridos' },
        { status: 400 }
      );
    }

    // Crear tenant + plan en una transacción
    const tenant = await prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          company_name,
          slug,
          custom_domain: custom_domain || null,
          owner_name: owner_name || null,
          owner_email,
          owner_phone: owner_phone || null,
          primary_color: primary_color || '#000000',
          secondary_color: secondary_color || '#ffffff',
        },
      });

      await tx.tenantPlan.create({
        data: {
          tenantId: newTenant.id,
          plan: plan || 'starter',
          status: 'trial',
          setupPaid: setup_paid || false,
          monthlyPrice: plan === 'growth' ? 29900 : plan === 'pro' ? 49900 : 14900,
        },
      });

      return newTenant;
    });

    return NextResponse.json({ tenant }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un tenant con ese slug o email' },
        { status: 409 }
      );
    }
    console.error('Error creating tenant:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}