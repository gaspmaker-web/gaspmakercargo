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
function calculateRate_TT(weight: number): number {
    if (weight <= 10) return 85.00;
    if (weight <= 44) return 110.00;
    return weight * 3.00; 
}

function calculateRate_BB(weight: number): number {
    if (weight <= 10) return 85.00;
    if (weight <= 44) return 110.00;
    return weight * 3.00; 
}

function calculateRate_JM(weight: number): number {
    if (weight <= 5) return 55.00;
    if (weight <= 11) return 75.00;
    if (weight <= 20) return 95.00;
    if (weight <= 44) return 110.00;
    if (weight <= 85) return 180.00;
    return weight * 2.35; 
}

function calculateRate_VI(weight: number): number {
    if (weight <= 30) return 105.00;
    return weight * 3.50; 
}

function calculateRate_CU(weight: number): number {
    if (weight <= 10) return 55.00;
    return weight * 5.50; 
}

function calculateRate_GD(weight: number): number {
    if (weight <= 10) return 85.00;
    if (weight <= 44) return 110.00;
    return weight * 2.50; 
}

// 🔥 BARBADOS — Rate actualizado Dic 2025 (Laparkan nuevo rate)
function calculateOceanRate_BB(cuft: number): number {
    const safeCuft = Math.max(1, cuft);
    if (safeCuft <= 5)  return 90.00;
    if (safeCuft <= 10) return 128.00;
    if (safeCuft <= 15) return 165.00;
    if (safeCuft <= 20) return 209.00;
    if (safeCuft <= 25) return 272.00;
    return parseFloat((safeCuft * 10.90).toFixed(2));
}

// 🔥 TRINIDAD — Rate actualizado Dic 2025 (Laparkan nuevo rate)
function calculateOceanRate_TT(cuft: number): number {
    const safeCuft = Math.max(1, cuft);
    if (safeCuft <= 5)  return 77.00;
    if (safeCuft <= 10) return 123.00;
    if (safeCuft <= 15) return 155.00;
    if (safeCuft <= 20) return 195.00;
    if (safeCuft <= 25) return 255.00;
    return parseFloat((safeCuft * 10.30).toFixed(2));
}

// 🌊 GRENADA
function calculateOceanRate_GD(cuft: number): number {
    const safeCuft = Math.max(1, cuft);
    if (safeCuft <= 5)  return 100.00;
    if (safeCuft <= 10) return 150.00;
    if (safeCuft <= 15) return 200.00;
    if (safeCuft <= 20) return 260.00;
    if (safeCuft <= 25) return 340.00;
    return parseFloat((safeCuft * 14.60).toFixed(2));
}

// 🌊 JAMAICA
function calculateOceanRate_JM_Ocean(cuft: number): number {
    const safeCuft = Math.max(1, cuft);
    if (safeCuft <= 5)  return 85.00;
    if (safeCuft <= 10) return 125.00;
    if (safeCuft <= 15) return 155.00;
    if (safeCuft <= 20) return 200.00;
    if (safeCuft <= 25) return 255.00;
    return parseFloat((safeCuft * 10.05).toFixed(2));
}

// 🌊 ANTIGUA
function calculateOceanRate_AG(cuft: number): number {
    const safeCuft = Math.max(1, cuft);
    if (safeCuft <= 5)  return 95.00;
    if (safeCuft <= 10) return 140.00;
    if (safeCuft <= 15) return 180.00;
    if (safeCuft <= 20) return 230.00;
    if (safeCuft <= 25) return 305.00;
    return parseFloat((safeCuft * 12.65).toFixed(2));
}

// 🌊 DOMINICA
function calculateOceanRate_DM(cuft: number): number {
    const safeCuft = Math.max(1, cuft);
    if (safeCuft <= 5)  return 95.00;
    if (safeCuft <= 10) return 140.00;
    if (safeCuft <= 15) return 180.00;
    if (safeCuft <= 20) return 235.00;
    if (safeCuft <= 25) return 305.00;
    return parseFloat((safeCuft * 12.72).toFixed(2));
}

// 🌊 GUYANA
function calculateOceanRate_GY(cuft: number): number {
    const safeCuft = Math.max(1, cuft);
    if (safeCuft <= 5)  return 95.00;
    if (safeCuft <= 10) return 135.00;
    if (safeCuft <= 15) return 170.00;
    if (safeCuft <= 20) return 215.00;
    if (safeCuft <= 25) return 280.00;
    return parseFloat((safeCuft * 10.78).toFixed(2));
}

// 🌊 ST. LUCIA
function calculateOceanRate_LC(cuft: number): number {
    const safeCuft = Math.max(1, cuft);
    if (safeCuft <= 5)  return 100.00;
    if (safeCuft <= 10) return 150.00;
    if (safeCuft <= 15) return 195.00;
    if (safeCuft <= 20) return 255.00;
    if (safeCuft <= 25) return 335.00;
    return parseFloat((safeCuft * 14.23).toFixed(2));
}

// 🌊 ST. VINCENT
function calculateOceanRate_VC(cuft: number): number {
    const safeCuft = Math.max(1, cuft);
    if (safeCuft <= 5)  return 100.00;
    if (safeCuft <= 10) return 155.00;
    if (safeCuft <= 15) return 205.00;
    if (safeCuft <= 20) return 265.00;
    if (safeCuft <= 25) return 345.00;
    return parseFloat((safeCuft * 14.96).toFixed(2));
}

// 🌊 ST. MAARTEN
function calculateOceanRate_MF(cuft: number): number {
    const safeCuft = Math.max(1, cuft);
    if (safeCuft <= 5)  return 100.00;
    if (safeCuft <= 10) return 150.00;
    if (safeCuft <= 15) return 195.00;
    if (safeCuft <= 20) return 250.00;
    if (safeCuft <= 25) return 330.00;
    return parseFloat((safeCuft * 14.11).toFixed(2));
}

// 🌊 SURINAME
function calculateOceanRate_SR(cuft: number): number {
    const safeCuft = Math.max(1, cuft);
    if (safeCuft <= 5)  return 95.00;
    if (safeCuft <= 10) return 135.00;
    if (safeCuft <= 15) return 175.00;
    if (safeCuft <= 20) return 225.00;
    if (safeCuft <= 25) return 295.00;
    return parseFloat((safeCuft * 12.17).toFixed(2));
}

// ==========================================
// 2. CONTROLADOR PRINCIPAL (API ROUTE)
// ==========================================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { weight, weightLbs, dimensions, destination, distanceMiles, auraDetails, serviceType } = body;
    
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
                const easyPostRates = shipment.rates.map((rate: any) => {
                    let logoUrl = null;
                    const carrierUpper = (rate.carrier || '').toUpperCase();
                    if (carrierUpper.includes('USPS') || carrierUpper.includes('POSTAL')) logoUrl = '/usps-logo.svg';
                    else if (carrierUpper.includes('FEDEX')) logoUrl = '/fedex-express-6.svg';
                    else if (carrierUpper.includes('DHL')) logoUrl = '/dhl-1.svg';
                    else if (carrierUpper.includes('UPS')) logoUrl = '/ups-united-parcel-service.svg';

                    const basePrice = parseFloat(rate.rate);
                    const priceWithMarkup = basePrice * 1.30; 

                    return {
                        id: rate.id, 
                        carrier: rate.carrier, 
                        service: rate.service,
                        price: parseFloat(priceWithMarkup.toFixed(2)), 
                        currency: rate.currency,
                        days: rate.delivery_days ? `${rate.delivery_days} days` : '3-7 days', 
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

if (targetCountryCode === 'BB') {
        if (showAir) {
            const priceAir = (isVipWholesale && chargeableWeight >= 230) 
                ? chargeableWeight * 2.80 
                : calculateRate_BB(chargeableWeight);
            rawRates.push({ id: 'GMC-BB-AIR', carrier: 'Gasp Maker Cargo', service: 'Barbados Direct (Air)', price: priceAir, days: '3-5 days', logo: gmcLogo });
        }
        
        if (showOcean) {
            const priceOcean = calculateOceanRate_BB(totalCuft);
            rawRates.push({ id: 'GMC-BB-OCEAN', carrier: 'Gasp Maker Cargo', service: 'Barbados Maritime', price: parseFloat(priceOcean.toFixed(2)), days: '14-21 days', logo: gmcLogo });
        }
    }
    
    if (targetCountryCode === 'TT') {
        if (showAir) {
            const priceAir = (isVipWholesale && chargeableWeight >= 230) 
                ? chargeableWeight * 2.80 
                : calculateRate_TT(chargeableWeight);
            rawRates.push({ id: 'GMC-TT-AIR', carrier: 'Gasp Maker Cargo', service: 'Trinidad Direct (Air)', price: priceAir, days: '3-5 days', logo: gmcLogo });
        }
        
        if (showOcean) {
            const priceOcean = calculateOceanRate_TT(totalCuft);
            rawRates.push({ id: 'GMC-TT-OCEAN', carrier: 'Gasp Maker Cargo', service: 'Trinidad Maritime', price: parseFloat(priceOcean.toFixed(2)), days: '14-21 days', logo: gmcLogo });
        }
    }

    // 🌊 NUEVOS DESTINOS MARÍTIMOS
    const oceanRoutes: Record<string, {fn: (c: number) => number, service: string}> = {
        'GD': { fn: calculateOceanRate_GD,       service: 'Grenada Maritime' },
        'JM': { fn: calculateOceanRate_JM_Ocean,  service: 'Jamaica Maritime' },
        'AG': { fn: calculateOceanRate_AG,        service: 'Antigua Maritime' },
        'DM': { fn: calculateOceanRate_DM,        service: 'Dominica Maritime' },
        'GY': { fn: calculateOceanRate_GY,        service: 'Guyana Maritime' },
        'LC': { fn: calculateOceanRate_LC,        service: 'St. Lucia Maritime' },
        'VC': { fn: calculateOceanRate_VC,        service: 'St. Vincent Maritime' },
        'MF': { fn: calculateOceanRate_MF,        service: 'St. Maarten Maritime' },
        'SR': { fn: calculateOceanRate_SR,        service: 'Suriname Maritime' },
    };

    if (showOcean && oceanRoutes[targetCountryCode]) {
        const route = oceanRoutes[targetCountryCode];
        const priceOcean = route.fn(totalCuft);
        rawRates.push({
            id: `GMC-${targetCountryCode}-OCEAN`,
            carrier: 'Gasp Maker Cargo',
            service: route.service,
            price: parseFloat(priceOcean.toFixed(2)),
            days: '14-21 days',
            logo: gmcLogo
        });
    }
    
    if (showAir) {
        if (targetCountryCode === 'JM') {
            rawRates.push({ id: 'GMC-JM', carrier: 'Gasp Maker Cargo', service: 'Jamaica Direct', price: calculateRate_JM(chargeableWeight), days: '3-5 days', logo: gmcLogo });
        }
        if (targetCountryCode === 'CU') {
            rawRates.push({ id: 'GMC-CU', carrier: 'Gasp Maker Cargo', service: 'Aerovaradero', price: calculateRate_CU(chargeableWeight), days: '15-21 days', logo: gmcLogo });
        }
        if (isStThomas) {
            rawRates.push({ id: 'GMC-VI', carrier: 'Gasp Maker Cargo', service: 'St. Thomas Direct', price: calculateRate_VI(chargeableWeight), days: '3-5 days', logo: gmcLogo });
        }
    }

    // ==========================================
    // 8. FILTRO Y LIMPIEZA FINAL
    // ==========================================
    rawRates = rawRates.filter(rate => {
        if (!rate.price || rate.price < 1) return false;
        if (rate.service && (rate.service.toUpperCase().includes('TRINIDAD DIRECT') || rate.service.toUpperCase().includes('AIR FREIGHT')) && !rate.id.startsWith('GMC')) { 
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