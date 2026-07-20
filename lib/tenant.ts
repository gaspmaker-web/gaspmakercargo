// lib/tenant.ts
// ==========================================
// 🏢 CARGOOS: TENANT CONTEXT
// ==========================================

import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

export interface TenantConfig {
  id: string;
  slug: string;
  company_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  custom_domain: string | null;
  plan: string;
  plan_status: string;
  easypost_api_key: string | null;
  stripe_publishable_key: string | null;
}

// Cache simple en memoria para evitar queries repetidas
const tenantCache = new Map<string, { data: TenantConfig; expires: number }>();
const CACHE_TTL = 60 * 1000; // 1 minuto

// ==========================================
// 🔍 GET TENANT — Para Server Components y API Routes
// ==========================================
export async function getTenant(): Promise<TenantConfig | null> {
  try {
const headersList = headers();
const host = headersList.get('host') || '';

// 🏢 1. Variable de entorno por proyecto (más confiable en Vercel)
const envSlug = process.env.TENANT_SLUG;

// 🏢 2. Fallback: detectar por host
let slug = envSlug || headersList.get('x-tenant-slug') || 'gaspmaker';

if (!envSlug) {
  if (host.includes('cargoos.io')) {
    slug = 'cargoos';
  } else if (host.includes('gaspmakercargo.com') || host.includes('localhost')) {
    slug = 'gaspmaker';
  }
}

    // Revisar cache primero
    const cached = tenantCache.get(slug);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    // Buscar en BD
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { slug },
          { custom_domain: slug }
        ]
      },
      select: {
        id: true,
        slug: true,
        company_name: true,
        logo_url: true,
        primary_color: true,
        secondary_color: true,
        custom_domain: true,
        plan: true,
        plan_status: true,
        easypost_api_key: true,
        stripe_publishable_key: true,
      }
    });

    if (!tenant) return null;

    // Guardar en cache
    tenantCache.set(slug, {
      data: tenant as TenantConfig,
      expires: Date.now() + CACHE_TTL
    });

    return tenant as TenantConfig;

  } catch (error) {
    console.error('Error getting tenant:', error);
    return null;
  }
}

// ==========================================
// 🎨 GET TENANT CSS VARS — Para inyectar colores
// ==========================================
export function getTenantCSSVars(tenant: TenantConfig | null) {
  return {
    '--color-primary': tenant?.primary_color || '#000000',
    '--color-secondary': tenant?.secondary_color || '#ffffff',
  } as React.CSSProperties;
}