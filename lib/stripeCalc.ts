/**
 * LÓGICA FINANCIERA GASP MAKER CARGO
 * Objetivo: Asegurar que el monto neto recibido cubra los fees de Stripe Internacionales.
 * Estándar calculado: 4.4% + $0.30 USD por transacción (Tarjetas internacionales sin conversión de moneda).
 */

export const calculateTotalWithFees = (amountNet: number) => {
  // Configuración de Stripe exacta basada en facturas reales (Trinidad, Barbados)
  const STRIPE_PERCENTAGE = 0.044; // 4.4% (Cubre 2.9% base + 1.5% tarjeta internacional)
  const STRIPE_FIXED_FEE = 0.30;   // $0.30 USD por transacción fija

  // Fórmula Inversa: (Monto Neto) / (1 - Porcentaje) + Fijo
  // Matemáticamente, esto asegura que después de que Stripe descuente su tajada, a ti te quede el `amountNet` exacto.
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