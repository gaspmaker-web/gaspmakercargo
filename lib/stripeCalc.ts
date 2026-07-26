/**
 * LÓGICA FINANCIERA GASP MAKER CARGO / CARGOOS
 * Stripe International: porcentaje configurable por tenant desde tenant_rates
 * Fallback: 4.4% + $0.30 USD por transacción (Tarjetas internacionales)
 */

export const calculateTotalWithFees = (amountNet: number, stripePercentage: number = 0.044) => {
  const STRIPE_FIXED_FEE = 0.30;
  const amountToCharge = (amountNet + STRIPE_FIXED_FEE) / (1 - stripePercentage);
  return Math.round(amountToCharge * 100) / 100;
};

export const getProcessingFee = (amountNet: number, stripePercentage: number = 0.044) => {
  if (amountNet === 0) return 0;
  const total = calculateTotalWithFees(amountNet, stripePercentage);
  return Number((total - amountNet).toFixed(2));
};