export interface AuraBox {
  length: number;
  width: number;
  height: number;
  realWeight: number;
  // 🔥 NUEVO: Flag para indicar que este pallet ya fue armado físicamente por el admin
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
}

interface Layer {
  areaUsed: number;
  maxHeight: number;
}

interface PalletSimulator {
  layers: Layer[];
  totalHeight: number;
  billableWeight: number;
  isFullPallet?: boolean; // 🔥 NUEVO: Marca si es un pallet completo (40x48x72)
}

// ==========================================
// 🔥 HELPER: Determina si un pallet es FULL
// ==========================================
// Un pallet es FULL si sus dimensiones equivalen a un pallet estándar (40x48x~72)
// El peso volumétrico se usa para cajas livianas pero grandes (ej: algodón 40lb en 40x48x70)
function isFullPallet(length: number, width: number, height: number, realWeight: number): boolean {
  const PALLET_L = 40;
  const PALLET_W = 48;
  const MIN_FULL_HEIGHT = 36; // Al menos la mitad de un pallet se considera full

  // Normalizamos las dimensiones (sin importar orientación)
  const dims = [length, width, height].sort((a, b) => b - a);
  const longestTwo = [dims[0], dims[1]].sort((a, b) => a - b);

  // Verificamos si las dos dimensiones base son ≈ 40x48 (con ±5in de tolerancia)
  const baseMatchesPallet =
    longestTwo[0] >= PALLET_L - 5 && longestTwo[0] <= PALLET_L + 5 &&
    longestTwo[1] >= PALLET_W - 5 && longestTwo[1] <= PALLET_W + 5;

  // La altura mínima para considerarse pallet completo
  const heightOk = dims[2] >= MIN_FULL_HEIGHT;

  // Peso real mínimo para ser pallet (descarta cajas pequeñas con dimensiones coincidentes)
  const weightOk = realWeight >= 10;

  // Peso volumétrico (divisor 166 para freight local)
  const volWeight = (length * width * height) / 166;

  // Si las dimensiones coinciden con un pallet Y tiene peso/volumen suficiente → es FULL
  return (baseMatchesPallet && heightOk && weightOk) || volWeight >= 151;
}

/**
 * Motor principal de Aura - Enterprise 3D Bin Packing Heuristic
 * 
 * 🔥 MODO PRE-ARMADO: Si las cajas vienen con isPreBuiltPallet=true (desde auraDetails del admin),
 *    se salta el simulador de Tetris y cada entrada se trata como un pallet ya confirmado.
 * 
 * 🔥 MODO SIMULACIÓN: Si las cajas son individuales sin armar, se usa el Tetris 3D original.
 */
export function calculateAuraLocalDelivery(
  boxes: AuraBox[],
  distanceMiles: number = 0
): AuraResult {
  let totalBillableWeight = 0;

  // DIMENSIONES ESTÁNDAR DEL CAMIÓN/PALLET
  const PALLET_LENGTH = 48;
  const PALLET_WIDTH = 40;
  const PALLET_AREA = PALLET_LENGTH * PALLET_WIDTH; // 1920 sq inches
  const MAX_HEIGHT = 72; // Límite de la Transit

  let pallets: PalletSimulator[] = [];

  // ==========================================
  // 🔥 DETECCIÓN DE MODO: ¿Pre-armado o Simulación?
  // ==========================================
  const isPreBuiltMode = boxes.length > 0 && boxes.every(b => b.isPreBuiltPallet === true);

  if (isPreBuiltMode) {
    // ==========================================
    // 🚚 MODO PRE-ARMADO (Admin ya armó los pallets)
    // Cada entrada en boxes = 1 pallet físico confirmado
    // NO se reorganizan, se respetan tal cual
    // ==========================================
    boxes.forEach(box => {
      const realWeight = box.realWeight || 1;
      const volWeight = (box.length * box.width * box.height) / 166;
      const billableWeight = Math.max(realWeight, volWeight);
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
    // ✈️ MODO SIMULACIÓN (Tetris 3D original)
    // Para cuando llegan cajas individuales sin armar
    // ==========================================
    pallets = [{ layers: [], totalHeight: 0, billableWeight: 0 }];

    // 1. ORDENAMIENTO POR VOLUMEN (Las cajas más grandes primero)
    const sortedBoxes = [...boxes].sort((a, b) => {
      const volA = (a.length || 1) * (a.width || 1) * (a.height || 1);
      const volB = (b.length || 1) * (b.width || 1) * (b.height || 1);
      return volB - volA;
    });

    // 2. SIMULADOR DE TETRIS 3D
    sortedBoxes.forEach(box => {
      const d = [box.length || 1, box.width || 1, box.height || 1];
      const weight = box.realWeight || 1;

      const volWeight = (d[0] * d[1] * d[2]) / 166;
      const billableWeight = Math.max(weight, volWeight);
      totalBillableWeight += billableWeight;

      const orientations = [
        { baseL: d[0], baseW: d[1], h: d[2] },
        { baseL: d[0], baseW: d[2], h: d[1] },
        { baseL: d[1], baseW: d[2], h: d[0] }
      ];

      let currentPallet = pallets[pallets.length - 1];
      let boxPlaced = false;

      for (let layer of currentPallet.layers) {
        let bestOri = null;
        let minHeightIncrease = Infinity;

        for (let ori of orientations) {
          const boxArea = ori.baseL * ori.baseW;
          if (boxArea <= PALLET_AREA && layer.areaUsed + boxArea <= PALLET_AREA) {
            let heightIncrease = Math.max(0, ori.h - layer.maxHeight);
            if (currentPallet.totalHeight + heightIncrease <= MAX_HEIGHT) {
              if (heightIncrease < minHeightIncrease) {
                minHeightIncrease = heightIncrease;
                bestOri = { ...ori, boxArea };
              }
            }
          }
        }

        if (bestOri) {
          layer.areaUsed += bestOri.boxArea;
          if (minHeightIncrease > 0) {
            layer.maxHeight += minHeightIncrease;
            currentPallet.totalHeight += minHeightIncrease;
          }
          currentPallet.billableWeight += billableWeight;
          boxPlaced = true;
          break;
        }
      }

      if (!boxPlaced) {
        let validOrientations = orientations.filter(o => (o.baseL * o.baseW) <= PALLET_AREA);
        if (validOrientations.length === 0) {
          validOrientations = orientations.sort((a, b) => (a.baseL * a.baseW) - (b.baseL * b.baseW));
        } else {
          validOrientations = validOrientations.sort((a, b) => a.h - b.h);
        }

        let bestOri = validOrientations[0];
        const boxArea = bestOri.baseL * bestOri.baseW;

        if (currentPallet.totalHeight + bestOri.h <= MAX_HEIGHT) {
          currentPallet.layers.push({ areaUsed: boxArea, maxHeight: bestOri.h });
          currentPallet.totalHeight += bestOri.h;
          currentPallet.billableWeight += billableWeight;
        } else {
          pallets.push({
            layers: [{ areaUsed: boxArea, maxHeight: bestOri.h }],
            totalHeight: bestOri.h,
            billableWeight: billableWeight
          });
        }
      }
    });

    // Marcar pallets full en modo simulación también
    pallets.forEach((p, i) => {
      p.isFullPallet = p.billableWeight >= 151;
    });
  }

  // ==========================================
  // 3. FACTURACIÓN LINEAL
  // ==========================================
  const palletCount = pallets.length;
  let baseFare = 0;
  let appliedStrategy = '';
  let distanceSurcharge = 0;

  if (isPreBuiltMode) {
    // 🔥 MODO PRE-ARMADO: Cada pallet se cobra individualmente
    // Full → $150 base + $13.95 millaje
    // Sobrante → solo su rango, sin millaje

    let extraMilesOneWay = 0;
    if (distanceMiles > 10) {
      extraMilesOneWay = distanceMiles - 10;
    }

    pallets.forEach(pallet => {
      if (pallet.isFullPallet) {
        // Pallet completo: $150 base
        baseFare += 150.00;
        // Millaje solo para pallets full
        if (extraMilesOneWay > 0) {
          distanceSurcharge += extraMilesOneWay * 1.50;
        }
      } else {
        // Pallet sobrante: solo rango por peso, sin millaje
        const w = pallet.billableWeight;
        if (w >= 151) {
          baseFare += 150.00;
          // Si por alguna razón el sobrante pesa ≥151, también paga millaje
          if (extraMilesOneWay > 0) {
            distanceSurcharge += extraMilesOneWay * 1.50;
          }
        }
        else if (w >= 51) baseFare += 85.00;
        else if (w >= 11) baseFare += 45.00;
        else baseFare += 25.00;
      }
    });

    appliedStrategy = palletCount > 1 ? 'PRE_BUILT_LINEAR' : 'PRE_BUILT_SINGLE';

  } else {
    // 🔥 MODO SIMULACIÓN: Lógica original
    const lastPalletWeight = pallets[palletCount - 1].billableWeight;
    let lastFare = 0;
    if (lastPalletWeight >= 151) lastFare = 150.00;
    else if (lastPalletWeight >= 51) lastFare = 85.00;
    else if (lastPalletWeight >= 11) lastFare = 45.00;
    else lastFare = 25.00;

    const fullPalletsCount = palletCount - 1;
    baseFare = fullPalletsCount * 150.00 + lastFare;
    appliedStrategy = palletCount > 1 ? 'LINEAR_PER_PALLET' : 'STANDARD_MIXED_DIMENSIONS';

    if (distanceMiles > 10) {
      const extraMilesOneWay = distanceMiles - 10;
      distanceSurcharge = extraMilesOneWay * 1.50 * fullPalletsCount;
      if (lastPalletWeight >= 151) {
        distanceSurcharge += extraMilesOneWay * 1.50;
      }
    }
  }

  const isHeavy = totalBillableWeight >= 850 || palletCount > 1;

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