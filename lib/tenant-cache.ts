// lib/tenant-cache.ts
// 🏢 CARGOOS: Tenant cache con Upstash Redis
// Evita queries a Supabase en cada request

import { Redis } from '@upstash/redis';
import prisma from '@/lib/prisma';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const CACHE_TTL = 300; // 5 minutos

export async function getTenantId(slug: string): Promise<string | null> {
  try {
    // 1. Buscar en cache
    const cached = await redis.get<string>(`tenant:${slug}`);
    if (cached) return cached;

    // 2. Buscar en BD
    const tenant = await prisma.tenant.findFirst({
      where: { slug },
      select: { id: true },
    });

    if (!tenant) return null;

    // 3. Guardar en cache con TTL
    await redis.set(`tenant:${slug}`, tenant.id, { ex: CACHE_TTL });

    return tenant.id;
  } catch (error) {
    console.error('Error en tenant cache:', error);
    // Fallback hardcoded si Redis falla
    const FALLBACK: Record<string, string> = {
      'gaspmaker': '654f5866-247c-4463-b7c7-5e4400c17bc2',
      'cargoos': '9ce9bad5-54fc-4cd7-9e3d-446ab395336b',
    };
    return FALLBACK[slug] || null;
  }
}