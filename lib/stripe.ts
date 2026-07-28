import Stripe from 'stripe';
import { getTenantStripe } from '@/lib/tenant-stripe';

// Cliente Stripe default (GaspMaker) — para compatibilidad con imports existentes
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia' as any,
  typescript: true,
});

// Export de la función dinámica por tenant
export { getTenantStripe };