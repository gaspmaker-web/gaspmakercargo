export interface AuraBox {
  length: number;
  width: number;
  height: number;
  realWeight: number;
  isPreBuiltPallet?: boolean;
}

export interface AuraResult {
  baseFare: number;
  distanceSurcharge: number;
  totalFare: number;
  totalBillableWeight: number;
  palletCount: number;
  isHeavy: boolean;
  appliedStrategy: string;
  vehicleType: string;
  distanceRate: number;
}

interface Layer {
  areaUsed: number;
  maxHeight: number;
}

interface PalletSimulator {
  layers: Layer[];
  totalHeight: number;
  billableWeight: number;
  isFullPallet?: boolean;
}

// ==========================================
// 💰 RATE TABLE ENTERPRISE — GaspMaker Cargo
// ==========================================
// Radio base: 10 millas incluidas desde warehouse
// Distancia UNA sola vez por viaje
//
// 0-40 lbs    → $30    | Car/SUV    | $1.25/mi
// 41-50 lbs   → $35    | Car/SUV    | $1.25/mi
// 51-60 lbs   → $40    | Minivan    | $1.50/mi
// 61-70 lbs   → $45    | Minivan    | $1.50/mi
// 71-80 lbs   → $50    | Minivan    | $1.50/mi
// 81-90 lbs   → $55    | Minivan    | $1.50/mi
// 91-100 lbs  → $60    | Minivan    | $1.50/mi
// 101-110 lbs → $65    | Minivan    | $1.50/mi
// 111-120 lbs → $70    | Minivan    | $1.50/mi
// 121-130 lbs → $75    | Minivan    | $1.50/mi
// 131-140 lbs → $80    | Minivan    | $1.50/mi
// 141-150 lbs → $85    | Minivan    | $1.50/mi
// 151-500 lbs → $150   | Cargo Van  | $1.75/mi
// 501-600 lbs → $175   | Cargo Van  | $1.75/mi
// 601-800 lbs → $225   | Box Truck  | $2.50/mi
// 801+ lbs    → $300   | Box Truck  | $2.50/mi

export function getBaseFareByWeight(weight: number): number {
  if (weight <= 40) return 30.00;
  if (weight <= 50) return 35.00;
  if (weight <= 60) return 40.00;
  if (weight <= 70) return 45.00;
  if (weight <= 80) return 50.00;
  if (weight <= 90) return 55.00;
  if (weight <= 100) return 60.00;
  if (weight <= 110) return 65.00;
  if (weight <= 120) return 70.00;
  if (weight <= 130) return 75.00;
  if (weight <= 140) return 80.00;
  if (weight <= 150) return 85.00;
  if (weight <= 500) return 150.00;   // Pallet flat
  if (weight <= 600) return 175.00;   // Tope 1
  if (weight <= 800) return 225.00;   // Tope 2
  return 300.00;                       // 801+ lbs (Box Truck)
}

// ==========================================
// 🚗 AUTO VEHICLE ASSIGNMENT — By Weight
// ==========================================
export function getVehicleByWeight(weight: number): { type: string; rate: number; maxLength: string; maxHeight: string } {
  if (weight <= 50) {
    return { type: 'CAR_SUV', rate: 1.25, maxLength: '4 ft', maxHeight: '' };
  }
  if (weight <= 150) {
    return { type: 'MINIVAN', rate: 1.50, maxLength: '7 ft', maxHeight: '4 ft' };
  }
  if (weight <= 800) {
    return { type: 'CARGO_VAN', rate: 1.75, maxLength: '12 ft', maxHeight: '6 ft' };
  }
  return { type: 'BOX_TRUCK', rate: 2.50, maxLength: '20 ft', maxHeight: '8 ft' };
}

// Vehicle info for pre-built mode (by total weight + pallet count)
function getVehicleInfo(totalWeight: number, palletCount: number): { type: string; rate: number } {
  if (totalWeight > 800 || palletCount > 2) {
    return { type: 'BOX_TRUCK', rate: 2.50 };
  }
  if (totalWeight > 150 || palletCount > 1) {
    return { type: 'CARGO_VAN', rate: 1.75 };
  }
  if (totalWeight > 100) {
    return { type: 'MINIVAN', rate: 1.50 };
  }
  return { type: 'CAR_SUV', rate: 1.25 };
}

// ==========================================
// 🔥 HELPER: Determina si un pallet es FULL
// ==========================================
function isFullPallet(length: number, width: number, height: number, realWeight: number): boolean {
  const PALLET_L = 40;
  const PALLET_W = 48;
  const MIN_FULL_HEIGHT = 36;

  const dims = [length, width, height].sort((a, b) => b - a);
  const longestTwo = [dims[0], dims[1]].sort((a, b) => a - b);

  const baseMatchesPallet =
    longestTwo[0] >= PALLET_L - 5 && longestTwo[0] <= PALLET_L + 5 &&
    longestTwo[1] >= PALLET_W - 5 && longestTwo[1] <= PALLET_W + 5;

  const heightOk = dims[2] >= MIN_FULL_HEIGHT;
  const weightOk = realWeight >= 10;
  const volWeight = (length * width * height) / 166;

  return (baseMatchesPallet && heightOk && weightOk) || volWeight >= 151;
}

/**
 * Motor Aura Enterprise — GaspMaker Cargo
 *
 * DOS MODOS:
 *
 * 🚚 PRE-ARMADO (Admin midió en bodega):
 *    - Cada pieza por peso REAL → rate table + topes
 *    - Vehículo auto por peso total + cantidad pallets
 *    - Distancia UNA vez por viaje
 *
 * 📱 SIMULACIÓN (Cliente en UI):
 *    - Peso seleccionado por el cliente → rate table directo
 *    - Vehículo auto-asignado por peso (0-150) o elegido (151+)
 *    - Distancia UNA vez por viaje
 *    - NO usa peso volumétrico para pricing
 */
export function calculateAuraLocalDelivery(
  boxes: AuraBox[],
  distanceMiles: number = 0
): AuraResult {
  let totalBillableWeight = 0;

  const PALLET_LENGTH = 48;
  const PALLET_WIDTH = 40;
  const PALLET_AREA = PALLET_LENGTH * PALLET_WIDTH;
  const MAX_HEIGHT = 72;

  let pallets: PalletSimulator[] = [];

  // ==========================================
  // DETECCIÓN DE MODO
  // ==========================================
  const isPreBuiltMode = boxes.length > 0 && boxes.every(b => b.isPreBuiltPallet === true);

  if (isPreBuiltMode) {
    // ==========================================
    // 🚚 MODO PRE-ARMADO (Admin ya armó los pallets)
    // ==========================================
    boxes.forEach(box => {
      const realWeight = box.realWeight || 1;
      const volWeight = (box.length * box.width * box.height) / 166;
      const billableWeight = realWeight;
      totalBillableWeight += billableWeight;

      const full = isFullPallet(box.length, box.width, box.height, realWeight);

      pallets.push({
        layers: [{ areaUsed: box.length * box.width, maxHeight: box.height }],
        totalHeight: box.height,
        billableWeight: billableWeight,
        isFullPallet: full
      });
    });

  } else {
    // ==========================================
    // 📱 MODO SIMULACIÓN
    // En este modo usamos el peso REAL del cliente
    // NO el peso volumétrico de dimensiones simuladas
    // ==========================================
    const totalRealWeight = boxes.reduce((sum, b) => sum + (b.realWeight || 1), 0);
    totalBillableWeight = totalRealWeight;

    pallets = [{
      layers: [],
      totalHeight: 0,
      billableWeight: totalRealWeight,
      isFullPallet: totalRealWeight >= 151
    }];
  }

  // ==========================================
  // 💰 FACTURACIÓN ENTERPRISE
  // ==========================================
  const palletCount = pallets.length;
  let baseFare = 0;
  let appliedStrategy = '';
  let distanceSurcharge = 0;
  let vehicleType = 'CAR_SUV';
  let distanceRate = 1.25;

  if (isPreBuiltMode) {
    // ==========================================
    // 🚚 PRE-ARMADO: Cada pieza por peso real + topes
    // Distancia UNA vez según vehículo total
    // ==========================================
  pallets.forEach(pallet => {
    if (pallet.billableWeight >= 151) {
        baseFare += 150.00; // Flat $150 por pallet
    } else {
        baseFare += getBaseFareByWeight(pallet.billableWeight);
    }
});

    const vehicle = getVehicleInfo(totalBillableWeight, palletCount);
    vehicleType = vehicle.type;
    distanceRate = vehicle.rate;

    if (distanceMiles > 10) {
      distanceSurcharge = (distanceMiles - 10) * vehicle.rate;
    }

    appliedStrategy = palletCount > 1 ? 'PRE_BUILT_LINEAR' : 'PRE_BUILT_SINGLE';

  } else {
    // ==========================================
    // 📱 SIMULACIÓN: Peso del cliente → rate table
    // Vehículo auto por peso → distancia
    // ==========================================
    const clientWeight = totalBillableWeight;

    // Base fare del rate table
    baseFare = getBaseFareByWeight(clientWeight);

    // Vehículo auto-asignado por peso
    const vehicle = getVehicleByWeight(clientWeight);
    vehicleType = vehicle.type;
    distanceRate = vehicle.rate;

    // Distancia UNA vez
    if (distanceMiles > 10) {
      distanceSurcharge = (distanceMiles - 10) * vehicle.rate;
    }

    appliedStrategy = 'WEIGHT_BASED_AUTO_VEHICLE';
  }

  const isHeavy = totalBillableWeight >= 850 || palletCount > 1;

  return {
    baseFare: parseFloat(baseFare.toFixed(2)),
    distanceSurcharge: parseFloat(distanceSurcharge.toFixed(2)),
    totalFare: parseFloat((baseFare + distanceSurcharge).toFixed(2)),
    totalBillableWeight: parseFloat(totalBillableWeight.toFixed(2)),
    palletCount,
    isHeavy,
    appliedStrategy,
    vehicleType,
    distanceRate
  };
}