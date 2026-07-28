// lib/tenant-easypost.ts
import EasyPost from '@easypost/api';
import prisma from '@/lib/prisma';
import { getTenantId } from '@/lib/tenant-cache';

// Cache de clientes EasyPost por tenant
const easypostCache = new Map<string, any>();

export async function getTenantEasyPost(tenantSlug?: string): Promise<any> {
  const slug = tenantSlug || process.env.TENANT_SLUG || 'gaspmaker';

  // Revisar cache
  if (easypostCache.has(slug)) return easypostCache.get(slug)!;

  try {
    const tenantId = await getTenantId(slug);
    if (tenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { easypost_api_key: true }
      });

      if (tenant?.easypost_api_key) {
        const client = new EasyPost(tenant.easypost_api_key);
        easypostCache.set(slug, client);
        return client;
      }
    }
  } catch (error) {
    console.error('Error getting tenant EasyPost:', error);
  }

  // Fallback — usar credenciales del .env (GaspMaker)
  return new EasyPost(process.env.EASYPOST_API_KEY!);
}