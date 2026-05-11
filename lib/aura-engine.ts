// Archivo: lib/aura-engine.ts

export interface AuraBox {
  length: number;
  width: number;
  height: number;
  realWeight: number;
}

export interface AuraResult {
  baseFare: number;
  distanceSurcharge: number;
  totalFare: number;
  totalBillableWeight: number;
  palletCount: number;
  isHeavy: boolean;
  appliedStrategy: string;
}

/**
 * Motor principal de Aura para calcular costos de entrega local en Miami/Broward.
 * Implementa Lógica Híbrida: Pallets completos a $150 y sobrantes evaluados por tier.
 */
export function calculateAuraLocalDelivery(
  boxes: AuraBox[],
  distanceMiles: number = 0
): AuraResult {
  let totalBillableWeight = 0;
  let currentPalletHeight = 0;
  let palletWeights: number[] = [0]; // Rastreamos el peso acumulado de cada pallet físico
  let palletIndex = 0;

  // 1. ANÁLISIS DE CAJAS (Límite de Apilamiento y Distribución de Pesos)
  boxes.forEach(box => {
    const l = box.length || 1;
    const w = box.width || 1;
    const h = box.height || 1;
    const weight = box.realWeight || 1;

    // A. Peso Cobrable Individual (Divisor 166)
    const volWeight = (l * w * h) / 166;
    const billableWeight = Math.max(weight, volWeight);
    totalBillableWeight += billableWeight;

    // B. Lógica de Apilamiento (72 pulgadas)
    if (currentPalletHeight + h > 72) {
      // Excede los 6 pies. Cerramos este pallet y abrimos uno nuevo para el sobrante.
      palletIndex++;
      palletWeights[palletIndex] = billableWeight;
      currentPalletHeight = h;
    } else {
      // Cabe en el bulto/pallet actual
      palletWeights[palletIndex] += billableWeight;
      currentPalletHeight += h;
    }
  });

  const palletCount = palletWeights.length;
  let baseFare = 0;
  let appliedStrategy = '';

  // 2. CLASIFICACIÓN DE TARIFA BASE (Lógica Híbrida)
  if (totalBillableWeight > 2000) {
    baseFare = totalBillableWeight * 0.35;
    appliedStrategy = 'BULK_RATE_0.35';
  } else {
    // Calculamos el costo de los pallets "completos" (todos menos el último) a $150 c/u
    const fullPalletsCount = palletCount - 1;
    const fullPalletsBasePrice = fullPalletsCount * 150.00;

    // El último bulto (o el único) se cobra según su peso específico (Tier)
    const lastPalletWeight = palletWeights[palletIndex];
    let lastPalletFare = 0;

    if (lastPalletWeight >= 151) {
      lastPalletFare = 150.00;
      appliedStrategy = palletCount > 1 ? 'HYBRID_FULL_OVERFLOW' : 'PALLET_MAX_150';
    } else if (lastPalletWeight >= 51) {
      lastPalletFare = 85.00;
      appliedStrategy = palletCount > 1 ? 'HYBRID_LARGE_OVERFLOW' : 'LARGE_PACKAGE_85';
    } else if (lastPalletWeight >= 11) {
      lastPalletFare = 45.00;
      appliedStrategy = palletCount > 1 ? 'HYBRID_MEDIUM_OVERFLOW' : 'MEDIUM_PACKAGE_45';
    } else {
      lastPalletFare = 25.00;
      appliedStrategy = palletCount > 1 ? 'HYBRID_SMALL_OVERFLOW' : 'SMALL_PACKAGE_25';
    }

    baseFare = fullPalletsBasePrice + lastPalletFare;
  }

  // 3. FACTOR DE MILLAJE LOCAL
  let distanceSurcharge = 0;
  const isHeavy = totalBillableWeight >= 151;

  if (distanceMiles > 10) {
    const extraMiles = distanceMiles - 10;
    const ratePerMile = isHeavy ? 2.50 : 1.50;
    distanceSurcharge = extraMiles * ratePerMile;
  }

  return {
    baseFare,
    distanceSurcharge,
    totalFare: baseFare + distanceSurcharge,
    totalBillableWeight: parseFloat(totalBillableWeight.toFixed(2)),
    palletCount,
    isHeavy,
    appliedStrategy
  };
}