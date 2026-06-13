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

interface Layer {
  areaUsed: number;
  maxHeight: number;
}

interface PalletSimulator {
  layers: Layer[];
  totalHeight: number;
  billableWeight: number;
}

/**
 * Motor principal de Aura - Enterprise 3D Bin Packing Heuristic
 * Optimiza cajas de múltiples dimensiones rotándolas y agrupándolas por capas.
 * 🔥 VERSIÓN OPTIMIZADA: Área 100% real sin margen de seguridad.
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

  // Inicializamos el primer pallet en nuestro simulador
  let pallets: PalletSimulator[] = [
    { layers: [], totalHeight: 0, billableWeight: 0 }
  ];

  // 1. ORDENAMIENTO POR VOLUMEN (Las cajas más grandes primero, las pequeñas rellenan)
  const sortedBoxes = [...boxes].sort((a, b) => {
    const volA = (a.length || 1) * (a.width || 1) * (a.height || 1);
    const volB = (b.length || 1) * (b.width || 1) * (b.height || 1);
    return volB - volA; // Mayor a menor
  });

  // 2. SIMULADOR DE TETRIS 3D
  sortedBoxes.forEach(box => {
    const d = [box.length || 1, box.width || 1, box.height || 1];
    const weight = box.realWeight || 1;

    // A. Peso Cobrable Individual (Divisor 166)
    const volWeight = (d[0] * d[1] * d[2]) / 166;
    const billableWeight = Math.max(weight, volWeight);
    totalBillableWeight += billableWeight;

    // B. Extraer las 3 orientaciones posibles de la caja
    const orientations = [
      { baseL: d[0], baseW: d[1], h: d[2] }, // Normal
      { baseL: d[0], baseW: d[2], h: d[1] }, // De lado
      { baseL: d[1], baseW: d[2], h: d[0] }  // Parada
    ];

    let currentPallet = pallets[pallets.length - 1];
    let boxPlaced = false;

    // C. INTENTAR UBICAR LA CAJA EN LAS CAPAS EXISTENTES (Optimizando huecos)
    for (let layer of currentPallet.layers) {
      // Buscamos la mejor rotación que quepa en el espacio libre de esta capa
      // Preferimos la rotación que no aumente la altura máxima de la capa
      let bestOri = null;
      let minHeightIncrease = Infinity;

      for (let ori of orientations) {
        // 🔥 CAMBIO: Área de la caja al 100% (se eliminó el * 1.15)
        const boxArea = ori.baseL * ori.baseW; 
        
        if (layer.areaUsed + boxArea <= PALLET_AREA) {
          // La caja cabe en el piso. ¿Afecta la altura?
          let heightIncrease = Math.max(0, ori.h - layer.maxHeight);
          
          // Verificamos si este aumento de altura rompe el techo del camión (72")
          if (currentPallet.totalHeight + heightIncrease <= MAX_HEIGHT) {
            if (heightIncrease < minHeightIncrease) {
              minHeightIncrease = heightIncrease;
              bestOri = { ...ori, boxArea };
            }
          }
        }
      }

      if (bestOri) {
        // Encontramos un hueco perfecto en una capa existente
        layer.areaUsed += bestOri.boxArea;
        if (minHeightIncrease > 0) {
          layer.maxHeight += minHeightIncrease;
          currentPallet.totalHeight += minHeightIncrease;
        }
        currentPallet.billableWeight += billableWeight;
        boxPlaced = true;
        break; // Pasamos a la siguiente caja
      }
    }

    // D. SI NO CUPO EN NINGÚN HUECO, CREAMOS UNA CAPA NUEVA
    if (!boxPlaced) {
      // Buscamos la rotación que ocupe menos altura para la nueva capa
      let bestOri = orientations.sort((a, b) => a.h - b.h)[0]; 
      // 🔥 CAMBIO: Área de la caja al 100% (se eliminó el * 1.15)
      const boxArea = bestOri.baseL * bestOri.baseW;

      if (currentPallet.totalHeight + bestOri.h <= MAX_HEIGHT) {
        // Cabe en el pallet actual como un piso nuevo
        currentPallet.layers.push({ areaUsed: boxArea, maxHeight: bestOri.h });
        currentPallet.totalHeight += bestOri.h;
        currentPallet.billableWeight += billableWeight;
      } else {
        // 🚨 SE LLENÓ EL PALLET. ABRIMOS UNO NUEVO.
        let newPallet = {
          layers: [{ areaUsed: boxArea, maxHeight: bestOri.h }],
          totalHeight: bestOri.h,
          billableWeight: billableWeight
        };
        pallets.push(newPallet);
      }
    }
  });

// 3. FACTURACIÓN LINEAL (Cobro estricto por pallet)
  const palletCount = pallets.length;
  let baseFare = 0;
  let appliedStrategy = '';

  // 🔥 ELIMINADO EL COBRO POR LIBRA: Ahora cobramos siempre los pallets a tarifa máxima ($150)
  const fullPalletsCost = (palletCount - 1) * 150.00;
  
  // El último pallet (Sobrante) se cobra por su peso exacto
  const lastPalletWeight = pallets[palletCount - 1].billableWeight;
  let lastFare = 0;
  if (lastPalletWeight >= 151) lastFare = 150.00;
  else if (lastPalletWeight >= 51) lastFare = 85.00;
  else if (lastPalletWeight >= 11) lastFare = 45.00;
  else lastFare = 25.00;

  baseFare = fullPalletsCost + lastFare;
  appliedStrategy = palletCount > 1 ? 'LINEAR_PER_PALLET' : 'STANDARD_MIXED_DIMENSIONS';

  // 🔥 4. FACTOR DE MILLAJE (Lineal y proporcional por pallet)
  const isHeavy = totalBillableWeight >= 850 || palletCount > 1; 
  let distanceSurcharge = 0;

  // Radio Base: Las primeras 10 millas desde el almacén son GRATIS
  if (distanceMiles > 10) {
    const extraMilesOneWay = distanceMiles - 10;

    // ➡️ TRAYECTO SIMPLE MULTIPLICADO: 
    // Multiplicamos la tarifa base de millaje ($1.50) por el número de pallets.
    // Así, 1 pallet paga $13.95 de millaje, y 3 pallets pagan $41.85 exactos.
    distanceSurcharge = extraMilesOneWay * 1.50 * palletCount;
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