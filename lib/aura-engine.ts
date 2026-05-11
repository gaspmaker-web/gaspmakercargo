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
 * Considera peso volumétrico, límite de apilamiento (6 pies / 72 pulgadas) y millas.
 */
export function calculateAuraLocalDelivery(
  boxes: AuraBox[],
  distanceMiles: number = 0
): AuraResult {
  let totalBillableWeight = 0;
  let currentPalletHeight = 0;
  let palletCount = 1;

  // 1. ANÁLISIS DE CAJAS (Volumen vs Báscula y Límite de Apilamiento)
  boxes.forEach(box => {
    // Si falta alguna medida en la base de datos, asumimos 1 para no romper la matemática
    const l = box.length || 1;
    const w = box.width || 1;
    const h = box.height || 1;
    const weight = box.realWeight || 1;

    // A. Peso Cobrable (Volumen Terrestre Divisor 166 vs Peso Real)
    const volWeight = (l * w * h) / 166;
    const billableWeight = Math.max(weight, volWeight);
    totalBillableWeight += billableWeight;

    // B. Regla del Límite de 6 Pies (72 pulgadas por pallet)
    if (currentPalletHeight + h > 72) {
      // Excede los 6 pies. Cerramos este pallet y abrimos uno nuevo.
      palletCount++;
      currentPalletHeight = h; // El nuevo pallet arranca con la altura de esta caja
    } else {
      // Aún cabe en el pallet actual
      currentPalletHeight += h;
    }
  });

  // 2. CLASIFICACIÓN DE TARIFA BASE (Protección de márgenes)
  let baseFare = 0;
  let appliedStrategy = '';

  if (totalBillableWeight > 2000) {
    baseFare = totalBillableWeight * 0.35; // Carga Masiva a Granel (se anulan Tiers)
    appliedStrategy = 'BULK_RATE_0.35';
  } else if (totalBillableWeight >= 151) {
    baseFare = 150.00 * palletCount;       // Tarifa Tope Pallet/Pesada multiplicada por unidades
    appliedStrategy = 'PALLET_MAX_150';
  } else if (totalBillableWeight >= 51) {
    baseFare = 85.00;                      // Paquete Grande
    appliedStrategy = 'LARGE_PACKAGE_85';
  } else if (totalBillableWeight >= 11) {
    baseFare = 45.00;                      // Paquete Mediano
    appliedStrategy = 'MEDIUM_PACKAGE_45';
  } else {
    baseFare = 25.00;                      // Paquete Pequeño
    appliedStrategy = 'SMALL_PACKAGE_25';
  }

  // 3. FACTOR DE MILLAJE LOCAL (Con radio base de 10 millas)
  let distanceSurcharge = 0;
  const isHeavy = totalBillableWeight >= 151;

  if (distanceMiles > 10) {
    const extraMiles = distanceMiles - 10;
    // La camioneta Transit cuesta $1.50/milla, el camión pesado $2.50/milla
    const ratePerMile = isHeavy ? 2.50 : 1.50;
    
    // NOTA: Asumimos que si era carga pesada (isHeavy), el cálculo de 'distanceMiles'
    // que se le envía a este motor ya trae la suma del viaje redondo (ida y vuelta).
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