/**
 * LÓGICA FINANCIERA GASP MAKER CARGO
 * Objetivo: Asegurar que el monto neto recibido cubra los fees de Stripe Internacionales.
 * Estándar calculado: ~7.27% de recargo sobre la base de $100.
 */

export const calculateTotalWithFees = (amountNet: number) => {
  // Configuración de Stripe (Escenario conservador para tarjetas internacionales)
  const STRIPE_PERCENTAGE = 0.065; // 6.5% (Cubre 2.9% base + 1.5% intl + 1% conversión + margen seguridad)
  const STRIPE_FIXED_FEE = 0.30;   // $0.30 USD por transacción

  // Fórmula Inversa: (Monto + Fijo) / (1 - %)
  // Esto asegura que si quieres $100, cobres exactamente lo necesario para que te queden $100.
  const amountToCharge = (amountNet + STRIPE_FIXED_FEE) / (1 - STRIPE_PERCENTAGE);

  // Redondear a 2 decimales
  return Math.round(amountToCharge * 100) / 100;
};

/**
 * Devuelve solo el valor del Fee (lo que paga el cliente por encima del servicio)
 */
export const getProcessingFee = (amountNet: number) => {
    if (amountNet === 0) return 0;
    const total = calculateTotalWithFees(amountNet);
    return Number((total - amountNet).toFixed(2));
};