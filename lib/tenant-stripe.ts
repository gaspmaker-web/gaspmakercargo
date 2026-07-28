// lib/tenant-stripe.ts
import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { getTenantId } from '@/lib/tenant-cache';

// Cache de clientes Stripe por tenant
const stripeCache = new Map<string, Stripe>();

export async function getTenantStripe(tenantSlug?: string): Promise<Stripe> {
  const slug = tenantSlug || process.env.TENANT_SLUG || 'gaspmaker';
  
  // Revisar cache
  if (stripeCache.has(slug)) return stripeCache.get(slug)!;

  try {
    const tenantId = await getTenantId(slug);
    if (tenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { stripe_secret_key: true }
      });
      
      if (tenant?.stripe_secret_key) {
        const stripeClient = new Stripe(tenant.stripe_secret_key, {
          apiVersion: '2025-11-17.clover'
        });
        stripeCache.set(slug, stripeClient);
        return stripeClient;
      }
    }
  } catch (error) {
    console.error('Error getting tenant Stripe:', error);
  }

  // Fallback — usar credenciales del .env (GaspMaker)
  const defaultStripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover'
  });
  return defaultStripe;
}