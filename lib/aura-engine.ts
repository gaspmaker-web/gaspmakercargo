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

export interface AuraRates {
  // Base fares por peso
  base_0_40: number;
  base_41_50: number;
  base_51_60: number;
  base_61_70: number;
  base_71_80: number;
  base_81_90: number;
  base_91_100: number;
  base_101_110: number;
  base_111_120: number;
  base_121_130: number;
  base_131_140: number;
  base_141_150: number;
  base_151_500: number;
  base_501_600: number;
  base_601_800: number;
  base_801plus: number;
  // Vehicle rates por milla
  rate_car_suv: number;
  rate_minivan: number;
  rate_cargo_van: number;
  rate_box_truck: number;
  // Pre-built pallet
  pre_built_flat: number;
  pre_built_radius: number;
  base_radius: number;
}

export const DEFAULT_AURA_RATES: AuraRates = {
  base_0_40: 30.00,
  base_41_50: 35.00,
  base_51_60: 40.00,
  base_61_70: 45.00,
  base_71_80: 50.00,
  base_81_90: 55.00,
  base_91_100: 60.00,
  base_101_110: 65.00,
  base_111_120: 70.00,
  base_121_130: 75.00,
  base_131_140: 80.00,
  base_141_150: 85.00,
  base_151_500: 150.00,
  base_501_600: 175.00,
  base_601_800: 225.00,
  base_801plus: 300.00,
  rate_car_suv: 1.25,
  rate_minivan: 1.50,
  rate_cargo_van: 1.75,
  rate_box_truck: 2.50,
  pre_built_flat: 163.95,
  pre_built_radius: 20,
  base_radius: 10,
};

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

export function getBaseFareByWeight(weight: number, rates: AuraRates = DEFAULT_AURA_RATES): number {
  if (weight <= 40)  return rates.base_0_40;
  if (weight <= 50)  return rates.base_41_50;
  if (weight <= 60)  return rates.base_51_60;
  if (weight <= 70)  return rates.base_61_70;
  if (weight <= 80)  return rates.base_71_80;
  if (weight <= 90)  return rates.base_81_90;
  if (weight <= 100) return rates.base_91_100;
  if (weight <= 110) return rates.base_101_110;
  if (weight <= 120) return rates.base_111_120;
  if (weight <= 130) return rates.base_121_130;
  if (weight <= 140) return rates.base_131_140;
  if (weight <= 150) return rates.base_141_150;
  if (weight <= 500) return rates.base_151_500;
  if (weight <= 600) return rates.base_501_600;
  if (weight <= 800) return rates.base_601_800;
  return rates.base_801plus;
}

// ==========================================
// 🚗 AUTO VEHICLE ASSIGNMENT — By Weight
// ==========================================
export function getVehicleByWeight(weight: number, rates: AuraRates = DEFAULT_AURA_RATES): { type: string; rate: number; maxLength: string; maxHeight: string } {
  if (weight <= 50)  return { type: 'CAR_SUV',   rate: rates.rate_car_suv,   maxLength: '4 ft',  maxHeight: '' };
  if (weight <= 150) return { type: 'MINIVAN',   rate: rates.rate_minivan,   maxLength: '7 ft',  maxHeight: '4 ft' };
  if (weight <= 800) return { type: 'CARGO_VAN', rate: rates.rate_cargo_van, maxLength: '12 ft', maxHeight: '6 ft' };
  return              { type: 'BOX_TRUCK', rate: rates.rate_box_truck, maxLength: '20 ft', maxHeight: '8 ft' };
}

// Vehicle info for pre-built mode (by total weight + pallet count)
function getVehicleInfo(totalWeight: number, palletCount: number, rates: AuraRates = DEFAULT_AURA_RATES): { type: string; rate: number } {
  if (totalWeight > 800 || palletCount > 2) return { type: 'BOX_TRUCK',  rate: rates.rate_box_truck };
  if (totalWeight > 150 || palletCount > 1) return { type: 'CARGO_VAN',  rate: rates.rate_cargo_van };
  if (totalWeight > 100)                    return { type: 'MINIVAN',    rate: rates.rate_minivan };
  return                                           { type: 'CAR_SUV',    rate: rates.rate_car_suv };
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
  distanceMiles: number = 0,
  rates: AuraRates = DEFAULT_AURA_RATES
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
    // 🚚 PRE-ARMADO: flat por pallet dentro del radio
    // Fuera del radio: flat + millas extra × tarifa por pallet
    // Cajas sueltas: rate table normal + distancia desde base_radius
    // ==========================================
    const PRE_BUILT_PALLET_FLAT = rates.pre_built_flat;
    const PRE_BUILT_RADIUS = rates.pre_built_radius;

    let palletCountForFlat = 0;

    pallets.forEach(pallet => {
        if (pallet.billableWeight >= 151) {
            baseFare += PRE_BUILT_PALLET_FLAT;
            palletCountForFlat++;
        } else {
            baseFare += getBaseFareByWeight(pallet.billableWeight, rates);
        }
    });

    const vehicle = getVehicleInfo(totalBillableWeight, palletCount, rates);
    vehicleType = vehicle.type;
    distanceRate = vehicle.rate;

    // Distancia pallets: solo cobra millas FUERA del radio pre-built
    if (distanceMiles > PRE_BUILT_RADIUS && palletCountForFlat > 0) {
        distanceSurcharge = (distanceMiles - PRE_BUILT_RADIUS) * vehicle.rate * palletCountForFlat;
    }
    // Distancia cajas sueltas: solo si NO hay pallets en el mismo envío
    if (distanceMiles > rates.base_radius && palletCountForFlat === 0 && palletCount > palletCountForFlat) {
        distanceSurcharge += (distanceMiles - rates.base_radius) * vehicle.rate;
    }

    appliedStrategy = palletCount > 1 ? 'PRE_BUILT_LINEAR' : 'PRE_BUILT_SINGLE';

} else {
    // ==========================================
    // 📱 SIMULACIÓN: Peso del cliente → rate table
    // Vehículo auto por peso → distancia
    // ==========================================
    const clientWeight = totalBillableWeight;

    // Base fare del rate table
    baseFare = getBaseFareByWeight(clientWeight, rates);

    // Vehículo auto-asignado por peso
    const vehicle = getVehicleByWeight(clientWeight, rates);
    vehicleType = vehicle.type;
    distanceRate = vehicle.rate;

    // Distancia UNA vez
    if (distanceMiles > rates.base_radius) {
      distanceSurcharge = (distanceMiles - rates.base_radius) * vehicle.rate;
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