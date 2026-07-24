import { NextResponse } from 'next/server';
import easypost from '@/lib/easypost';
import { calculateAuraLocalDelivery, AuraBox } from '@/lib/aura-engine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ==========================================
// 🗺️ DICCIONARIO DE CAPITALES MAESTRO
// ==========================================
const DEFAULT_CAPITALS: Record<string, { city: string, zip?: string, state?: string }> = {
    'US': { city: 'Miami', state: 'FL', zip: '33166' },
    'CA': { city: 'Toronto', zip: 'M5V 2T6', state: 'ON' },
    'MX': { city: 'Mexico City', zip: '06000', state: 'CMX' },
    'GT': { city: 'Guatemala City', zip: '01001' },
    'HN': { city: 'Tegucigalpa', zip: '11101' },
    'SV': { city: 'San Salvador', zip: '1101' },
    'NI': { city: 'Managua', zip: '11001' },
    'CR': { city: 'San Jose', zip: '10101' },
    'PA': { city: 'Panama City', zip: '0801' },
    'CO': { city: 'Bogota', zip: '110111' },
    'VE': { city: 'Caracas', zip: '1010' },
    'AR': { city: 'Buenos Aires', zip: 'C1000' },
    'PE': { city: 'Lima', zip: '15001' },
    'CL': { city: 'Santiago', zip: '8320000' },
    'EC': { city: 'Quito', zip: '170150' },
    'BO': { city: 'La Paz', zip: '0000' },
    'PY': { city: 'Asuncion', zip: '1209' },
    'UY': { city: 'Montevideo', zip: '11000' },
    'BR': { city: 'Brasilia', zip: '70000-000' },
    'DO': { city: 'Santo Domingo', zip: '10100' },
    'PR': { city: 'San Juan', state: 'PR', zip: '00901' },
    'JM': { city: 'Kingston', zip: '' },
    'BS': { city: 'Nassau', zip: '' },
    'KY': { city: 'George Town', zip: 'KY1-1100' },
    'BB': { city: 'Bridgetown', zip: 'BB11000' },
    'TT': { city: 'Port of Spain', zip: '' },
    'AG': { city: 'St. John\'s', zip: '' },
    'AI': { city: 'The Valley', zip: 'AI2640' },
    'AW': { city: 'Oranjestad', zip: '' },
    'BM': { city: 'Hamilton', zip: 'HM 11' },
    'VG': { city: 'Road Town', zip: 'VG1110' },
    'GD': { city: 'St. George\'s', zip: '' },
    'VI': { city: 'Charlotte Amalie', state: 'VI', zip: '00802' },
    'BQ': { city: 'Kralendijk', zip: '' },
    'CW': { city: 'Willemstad', zip: '' },
    'DM': { city: 'Roseau', zip: '' },
    'GP': { city: 'Basse-Terre', zip: '97100' },
    'HT': { city: 'Port-au-Prince', zip: 'HT6110' },
    'MQ': { city: 'Fort-de-France', zip: '97200' },
    'MS': { city: 'Brades', zip: 'MSR1110' },
    'BL': { city: 'Gustavia', zip: '97133' },
    'KN': { city: 'Basseterre', zip: '' },
    'LC': { city: 'Castries', zip: 'LC04101' },
    'MF': { city: 'Marigot', zip: '97150' },
    'VC': { city: 'Kingstown', zip: 'VC0100' },
    'SX': { city: 'Philipsburg', zip: '' },
    'TC': { city: 'Cockburn Town', zip: 'TKCA 1ZZ' },
    'ES': { city: 'Madrid', zip: '28001' },
    'GB': { city: 'London', zip: 'SW1A 1AA' },
    'FR': { city: 'Paris', zip: '75001' },
    'DE': { city: 'Berlin', zip: '10115' },
    'IT': { city: 'Rome', zip: '00118' },
    'PT': { city: 'Lisbon', zip: '1000-001' },
    'AD': { city: 'Andorra la Vella', zip: 'AD500' },
    'AL': { city: 'Tirana', zip: '1001' },
    'JP': { city: 'Tokyo', zip: '100-0001' },
    'IN': { city: 'New Delhi', zip: '110001' },
    'AF': { city: 'Kabul', zip: '1001' },
    'DZ': { city: 'Algiers', zip: '16000' },
    'AO': { city: 'Luanda', zip: '0000' }
};

// ==========================================
// 1. TARIFAS LOCALES EXPORTACIÓN
// ==========================================


// ==========================================
// 2. CONTROLADOR PRINCIPAL (API ROUTE)
// ==========================================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { weight, weightLbs, dimensions, destination, distanceMiles, auraDetails, serviceType } = body;

    // 🏢 TENANT RATES — Motor dinámico
    const { getTenantId } = await import('@/lib/tenant-cache');
    const { getTenantRates } = await import('@/lib/tenant-rates');
    const tenantSlug = process.env.TENANT_SLUG || 'gaspmaker';
    const tenantId = await getTenantId(tenantSlug);
    const tenantRates = tenantId ? await getTenantRates(tenantId) : {};

    // Helper para leer tarifas con fallback
    const rate = (concept: string, countryCode?: string, fallback: number = 0) => {
      const key = countryCode ? `${concept}__${countryCode}` : concept;
      return tenantRates[key] ?? fallback;
    };
    
    // --- 🛡️ SANITIZACIÓN BÁSICA ---
    let finalWeightLbs = parseFloat(weightLbs || weight);
    if (isNaN(finalWeightLbs) || finalWeightLbs <= 0) finalWeightLbs = 1;

    const len = parseFloat(dimensions?.length) || undefined;
    const wid = parseFloat(dimensions?.width) || undefined;
    const hgt = parseFloat(dimensions?.height) || undefined;

    // ================================================================
    // 🔥 CÁLCULO DE PESO COBRABLE AÉREO (Regla Aerolínea / 139)
    // ================================================================
    const volumetricWeightAir = (len && wid && hgt) 
        ? (len * wid * hgt) / 139 
        : 0;
    
    const chargeableWeight = Math.max(finalWeightLbs, volumetricWeightAir);

    // ==========================================
    // 3. DETECCIÓN DE PAÍS Y ESTADO OMNISCIENTE
    // ==========================================
    const c1 = (destination?.country || '').toUpperCase().trim();
    const c2 = (destination?.countryCode || '').toUpperCase().trim();
    const c3 = (destination?.countryName || '').toUpperCase().trim();
    const rawZip = destination?.zip || destination?.postalCode || '';
    const rawCityInput = destination?.city || ''; 
    const rawStateInput = (destination?.state || '').toUpperCase().trim();

    let targetCountryCode = 'US'; 

    if (rawZip === '40100' || [c1, c2, c3].some(c => c.includes('CUBA'))) {
        targetCountryCode = 'CU';
    } 
    else {
        const codeCandidates = [c1, c2, c3].filter(c => c.length === 2 && c !== 'US');
        if (codeCandidates.length > 0) {
            targetCountryCode = codeCandidates[0];
        } else {
            const allText = [c1, c2, c3].join(' ');
            if (allText.includes('BARBADOS')) targetCountryCode = 'BB';
            else if (allText.includes('TRINIDAD')) targetCountryCode = 'TT';
            else if (allText.includes('JAMAICA')) targetCountryCode = 'JM';
            else if (allText.includes('GRENADA')) targetCountryCode = 'GD';
            else if (allText.includes('MEXICO')) targetCountryCode = 'MX';
            else if (allText.includes('DOMINICAN')) targetCountryCode = 'DO';
        }
    }

    const isStThomas = [c1, c2, c3].some(c => c === 'VI' || c.includes('VIRGIN')) || rawZip.startsWith('008');
    const easyPostCountryCode = isStThomas ? 'US' : targetCountryCode;

    // 🔥 DETECCIÓN FLORIDA (Miami / Broward)
    const isFloridaLocal = easyPostCountryCode === 'US' && (rawStateInput === 'FL' || rawStateInput === 'FLORIDA' || rawZip.startsWith('33'));

    // ==========================================
    // 4. CANDADOS DE SERVICIO Y AUTOCORRECCIÓN INTELIGENTE
    // ==========================================
    const reqType = serviceType || 'SHIPPING_INTL';
    let isOceanRequest = reqType === 'OCEAN_CONSOLIDATION';
    let isLocalRequest = reqType === 'LOCAL_DELIVERY';
    let isAirConsolidation = reqType === 'CONSOLIDATION';
    const isSinglePackage = reqType === 'SHIPPING_INTL';

    // 🛡️ REGLA ESTRICTA: Si cambia la dirección en el checkout, el sistema corrige el servicio
    if (!isFloridaLocal && isLocalRequest) {
        // El cliente pidió Local Delivery pero puso una dirección Internacional
        isLocalRequest = false;
        isAirConsolidation = true; // Lo pasamos a Aéreo para que no se quede bloqueado
    }
   // ANTES:
if (isFloridaLocal && isOceanRequest) {
    isOceanRequest = false;
    isLocalRequest = true;
}

// DESPUÉS:
if (isFloridaLocal && isOceanRequest) {
    // 🔥 Si es Marítimo, no lo convertimos a Local.
    // Simplemente bloqueamos todo y devolvemos error claro.
    return NextResponse.json({ 
        success: false, 
        rates: [],
        error: 'OCEAN_NOT_AVAILABLE_FOR_LOCAL',
        message: 'El servicio marítimo no está disponible para direcciones locales en Florida.'
    });
}
 // 🔒 Cerrando los candados finales
    // 🔥 Países con opción marítima disponible para paquetes individuales también
const oceanEligibleCountries = ['BB', 'TT', 'GD', 'JM', 'AG', 'DM', 'GY', 'LC', 'VC', 'MF', 'SR'];
const showOcean = isOceanRequest || (isSinglePackage && oceanEligibleCountries.includes(targetCountryCode));

    // 🛡️ GUARD MARÍTIMO: bloquea cotización ocean sin dimensiones reales.
    // Sin L×W×H, el cuft cae a 1 y devolvería el mínimo del tramo (precio irreal).
    if (isOceanRequest) {
        const hasRealDims = (len && len > 0) && (wid && wid > 0) && (hgt && hgt > 0);
        const hasPallets = Array.isArray(body.auraPieces || auraDetails)
                           && (body.auraPieces || auraDetails).length > 0;
        if (!hasRealDims && !hasPallets) {
            return NextResponse.json({
                success: false,
                rates: [],
                error: 'OCEAN_DIMENSIONS_REQUIRED',
                message: 'El servicio marítimo requiere las 3 dimensiones (largo, ancho y alto) para calcular el volumen.'
            }, { status: 400 });
        }
    }

    // 🚢 Para Ocean, también mostrar opciones aéreas para comparación
const showAir = isAirConsolidation || isSinglePackage || isOceanRequest;
    const showLocal = isFloridaLocal && (isLocalRequest || isSinglePackage);

    let rawRates: any[] = [];
    const gmcLogo = '/gaspmakercargoproject.png';

    // ==========================================
    // 5. MOTOR AURA (GASP MAKER LOCAL DELIVERY) 
    // ==========================================
    if (showLocal) {
        let auraBoxes: AuraBox[] = [];
        
        // 🔥 ACTUALIZACIÓN: Recibimos tanto los datos armados desde admin, como los generados en vivo
        const dynamicPallets = body.auraPieces || auraDetails;

       if (dynamicPallets && Array.isArray(dynamicPallets) && dynamicPallets.length > 0) {
    auraBoxes = dynamicPallets.map((b: any) => ({
        length: parseFloat(b.length) || 1,
        width: parseFloat(b.width) || 1,
        height: parseFloat(b.height) || 1,
        realWeight: parseFloat(b.weight || b.realWeight) || 1,
        isPreBuiltPallet: true  // 🔥 Admin ya armó estos pallets físicamente
    }));
} else {
    auraBoxes = [{
        length: len || 1,
        width: wid || 1,
        height: hgt || 1,
        realWeight: finalWeightLbs
        // ❌ Sin isPreBuiltPallet → usa el Tetris normal
    }];
}

        let calculatedMiles = parseFloat(distanceMiles) || 0;

        if (calculatedMiles === 0 && rawCityInput && rawZip) {
            try {
                const GMC_WAREHOUSE_ADDRESS = "1861 NW 22nd St, Miami, FL 33142";
                const destinationAddress = `${destination?.address || ''}, ${rawCityInput}, ${rawStateInput || 'FL'} ${rawZip}`.trim();
                const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
                
                if (googleApiKey && destinationAddress.length > 10) {
                    const mapUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(GMC_WAREHOUSE_ADDRESS)}&destinations=${encodeURIComponent(destinationAddress)}&units=imperial&key=${googleApiKey}`;
                    const mapRes = await fetch(mapUrl);
                    const mapData = await mapRes.json();
                    
                    if (mapData.status === 'OK' && mapData.rows[0].elements[0].status === 'OK') {
                        const distanceText = mapData.rows[0].elements[0].distance.text;
                        calculatedMiles = parseFloat(distanceText.replace(/[^0-9.]/g, ''));
                    }
                }
            } catch (error) {
                console.warn("⚠️ Error calculando distancia con Google Maps API en el backend", error);
            }
        }

    const safeDistanceMiles = Math.max(0, calculatedMiles);

const auraResult = calculateAuraLocalDelivery(auraBoxes, safeDistanceMiles);

        rawRates.push({
            id: 'GMC-AURA-LOCAL',
            carrier: 'Gasp Maker Cargo',
            service: 'Local Delivery (Aura)',
            price: parseFloat(auraResult.totalFare.toFixed(2)),
            days: 'Same Day - 1 Day Delivery', 
            logo: gmcLogo,
            auraDetails: auraResult 
        });
    }

    // ==========================================
    // 6. EASYPOST (Para resto de USA / Exportaciones selectas)
    // ==========================================
    if (targetCountryCode !== 'CU' && showAir) {
        try {
            let finalState = destination?.state;
            let finalCity = rawCityInput;
            let finalZip = rawZip ? rawZip.replace(/[^0-9-]/g, '') : undefined;

            if (!finalCity || finalCity.trim() === '') {
                const defaultCap = DEFAULT_CAPITALS[targetCountryCode];
                if (defaultCap) {
                    finalCity = defaultCap.city;
                    if (!finalZip && defaultCap.zip) finalZip = defaultCap.zip;
                    if (!finalState && defaultCap.state) finalState = defaultCap.state;
                } else {
                    finalCity = 'City'; 
                }
            }

            if (easyPostCountryCode === 'US') {
                const fullAddressString = `${rawCityInput} ${rawZip}`.replace(/\s+/g, ' ').trim();
                const addressMatch = fullAddressString.match(/^(.*?)[,\s]+([A-Za-z]{2})[\s,]+(\d{5}(?:-\d{4})?)/);

                if (addressMatch) {
                    finalCity = addressMatch[1].trim();        
                    finalState = addressMatch[2].toUpperCase();
                    finalZip = addressMatch[3];                
                } else {
                    if (!finalState && fullAddressString.toUpperCase().includes('FL')) finalState = 'FL';
                    if (!finalState && fullAddressString.toUpperCase().includes('NY')) finalState = 'NY';
                    
                    if (finalZip) finalCity = finalCity.replace(finalZip, '');
                    if (finalState) finalCity = finalCity.replace(finalState, '');
                    finalCity = finalCity.replace(/,/g, '').trim();
                }

                if (!finalCity || finalCity.length < 2) finalCity = 'Miami';
                if (!finalState) finalState = 'FL';
                if (!finalZip || finalZip.length < 5) finalZip = '33166';
            }

            const safeZip = (finalZip && finalZip.length >= 3) ? finalZip : undefined;
            
            const fromAddress = await easypost.Address.create({
                company: 'Gasp Maker Cargo', street1: '1861 NW 22nd St', city: 'Miami', state: 'FL', zip: '33142', country: 'US', phone: '786-282-0763',
            });
            
            const toAddress = await easypost.Address.create({
                name: destination?.name || 'Cliente', 
                street1: destination?.address || 'City Center', 
                city: finalCity, 
                state: finalState, 
                zip: safeZip, 
                country: easyPostCountryCode,
                phone: '555-555-5555'
            });
            
            const parcelData: any = { weight: finalWeightLbs * 16 };
            if (len) parcelData.length = len;
            if (wid) parcelData.width = wid;
            if (hgt) parcelData.height = hgt;

            const parcel = await easypost.Parcel.create(parcelData);
            
            const shipment = await easypost.Shipment.create({
                to_address: toAddress, from_address: fromAddress, parcel: parcel,
            });

    if (shipment.rates) {
                const easyPostRates = shipment.rates.map((epRate: any) => {
                    let logoUrl = null;
                    const carrierUpper = (epRate.carrier || '').toUpperCase();
                    if (carrierUpper.includes('USPS') || carrierUpper.includes('POSTAL')) logoUrl = '/usps-logo.svg';
                    else if (carrierUpper.includes('FEDEX')) logoUrl = '/fedex-express-6.svg';
                    else if (carrierUpper.includes('DHL')) logoUrl = '/dhl-1.svg';
                    else if (carrierUpper.includes('UPS')) logoUrl = '/ups-united-parcel-service.svg';

                    const basePrice = parseFloat(epRate.rate);
                    const priceWithMarkup = basePrice * rate('easypost_markup', undefined, 1.30);

                    return {
                        id: epRate.id, 
                        carrier: epRate.carrier, 
                        service: epRate.service,
                        price: parseFloat(priceWithMarkup.toFixed(2)), 
                        currency: epRate.currency,
                        days: epRate.delivery_days ? `${epRate.delivery_days} days` : '3-7 days', 
                        logo: logoUrl 
                    };
                });
                rawRates.push(...easyPostRates);
            }
        } catch (e: any) { 
            console.warn(`EasyPost Warning: ${e.message}`); 
        }
    }

    // ==========================================
    // 7. TARIFAS LOCALES (EXPORTACIÓN CARIBE)
    // ==========================================
    const isVipWholesale = body.isVip || false;

    // 🌊 CÁLCULO DE PIES CÚBICOS (CUFT) PARA TARIFA MARÍTIMA
    let totalCuft = 0;
    
    // 🔥 ACTUALIZACIÓN: Recibimos tanto los datos armados desde admin, como los generados en vivo
    const dynamicPallets = body.auraPieces || auraDetails;

    if (dynamicPallets && Array.isArray(dynamicPallets) && dynamicPallets.length > 0) {
        totalCuft = dynamicPallets.reduce((sum: number, b: any) => {
            const l = parseFloat(b.length) || 10;
            const w = parseFloat(b.width) || 10;
            const h = parseFloat(b.height) || 10;
            return sum + ((l * w * h) / 1728);
        }, 0);
    } else if (len && wid && hgt) {
        totalCuft = (len * wid * hgt) / 1728;
    } else {
        totalCuft = 1; 
    }

// 🏢 TARIFAS CARIBE AÉREO DINÁMICAS — desde tenant_rates
const airCountries = ['BB', 'TT', 'JM', 'GD', 'VI', 'CU'];
const airServiceNames: Record<string, string> = {
    'BB': 'Barbados Direct (Air)',
    'TT': 'Trinidad Direct (Air)',
    'JM': 'Jamaica Direct',
    'GD': 'Grenada Direct (Air)',
    'VI': 'St. Thomas Direct',
    'CU': 'Aerovaradero',
};
const airDays: Record<string, string> = {
    'BB': '3-5 days', 'TT': '3-5 days', 'JM': '3-5 days',
    'GD': '3-5 days', 'VI': '3-5 days', 'CU': '15-21 days',
};

const targetForAir = isStThomas ? 'VI' : targetCountryCode;

if (showAir && airCountries.includes(targetForAir)) {
    const airPerLb = rate('air_per_lb', targetForAir, 0);
    const minRate = rate('min_rate', targetForAir, 0);
    if (airPerLb > 0) {
        let priceAir = Math.max(chargeableWeight * airPerLb, minRate);
        if (isVipWholesale && chargeableWeight >= 230) {
            priceAir = chargeableWeight * 2.80;
        }
        rawRates.push({
            id: `GMC-${targetForAir}-AIR`,
            carrier: 'Gasp Maker Cargo',
            service: airServiceNames[targetForAir] || `${targetForAir} Direct (Air)`,
            price: parseFloat(priceAir.toFixed(2)),
            days: airDays[targetForAir] || '3-5 days',
            logo: gmcLogo
        });
    }
}

// 🌊 MARÍTIMO DINÁMICO — desde tenant_rates
const oceanCountries = ['BB', 'TT', 'GD', 'JM', 'AG', 'DM', 'GY', 'LC', 'VC', 'MF', 'SR'];
const oceanServiceNames: Record<string, string> = {
    'BB': 'Barbados Maritime', 'TT': 'Trinidad Maritime', 'GD': 'Grenada Maritime',
    'JM': 'Jamaica Maritime', 'AG': 'Antigua Maritime', 'DM': 'Dominica Maritime',
    'GY': 'Guyana Maritime', 'LC': 'St. Lucia Maritime', 'VC': 'St. Vincent Maritime',
    'MF': 'St. Maarten Maritime', 'SR': 'Suriname Maritime',
};

if (showOcean && oceanCountries.includes(targetCountryCode)) {
    const oceanPerCuft = rate('ocean_per_cuft', targetCountryCode, 0);
    const oceanMin = rate('ocean_min_1_5cuft', targetCountryCode, 0);
    if (oceanPerCuft > 0) {
        const safeCuft = Math.max(1, totalCuft);
        const priceOcean = safeCuft <= 5
            ? oceanMin
            : parseFloat((safeCuft * oceanPerCuft).toFixed(2));
        rawRates.push({
            id: `GMC-${targetCountryCode}-OCEAN`,
            carrier: 'Gasp Maker Cargo',
            service: oceanServiceNames[targetCountryCode] || `${targetCountryCode} Maritime`,
            price: parseFloat(priceOcean.toFixed(2)),
            days: '14-21 days',
            logo: gmcLogo
        });
    }
}

 // ==========================================
    // 8. FILTRO Y LIMPIEZA FINAL
    // ==========================================
    rawRates = rawRates.filter(r => {
        if (!r.price || r.price < 1) return false;
        if (r.service && (r.service.toUpperCase().includes('TRINIDAD DIRECT') || r.service.toUpperCase().includes('AIR FREIGHT')) && !r.id.startsWith('GMC')) { 
            return false;
        }
        return true;
    });

    rawRates.sort((a, b) => a.price - b.price);
    
    return NextResponse.json({ success: true, rates: rawRates, chargeableWeight });

  } catch (error: any) {
    console.error("API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}