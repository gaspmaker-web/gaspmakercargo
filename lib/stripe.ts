import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // Usamos la versión más reciente de la API.
  // TypeScript te avisará si necesitas actualizar esto.
  apiVersion: '2024-12-18.acacia' as any, // 🚨 CORREGIDO: Añadido 'as any' para evitar conflictos de versión
  typescript: true,
});