import { NextResponse } from 'next/server';
import easypost from '@/lib/easypost';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ==========================================
// 🗺️ DICCIONARIO DE CAPITALES
// ==========================================
const DEFAULT_CAPITALS: Record<string, { city: string, zip?: string, state?: string }> = {
    'DO': { city: 'Santo Domingo', zip: '10100' },
    'CO': { city: 'Bogota', zip: '110111' },
    'MX': { city: 'Mexico City', zip: '06000', state: 'CMX' },
    'ES': { city: 'Madrid', zip: '28001' },
    'US': { city: 'Miami', state: 'FL', zip: '33166' },
    'VE': { city: 'Caracas', zip: '1010' },
    'PA': { city: 'Panama City', zip: '0801' },
    'CA': { city: 'Toronto', zip: 'M5V 2T6', state: 'ON' },
    'GB': { city: 'London', zip: 'SW1A 1AA' },
    'FR': { city: 'Paris', zip: '75001' },
    'JM': { city: 'Kingston', zip: '' },
    'BS': { city: 'Nassau', zip: '' },
    'KY': { city: 'George Town', zip: '' },
    'BB': { city: 'Bridgetown', zip: 'BB11000' },
    'TT': { city: 'Port of Spain', zip: '' },
    'AG': { city: 'St. John\'s', zip: '' },
    'AI': { city: 'The Valley', zip: '' },
    'AW': { city: 'Oranjestad', zip: '' },
    'BM': { city: 'Hamilton', zip: 'HM 11' },
    'VG': { city: 'Road Town', zip: '' },
    'GD': { city: 'St. George\'s', zip: '' },
    'PR': { city: 'San Juan', state: 'PR', zip: '00901' },
    'VI': { city: 'Charlotte Amalie', state: 'VI', zip: '00802' }
};

// ==========================================
// 1. TARIFAS LOCALES
// ==========================================
function calculateRate_TT(weight: number): number {
    if (weight <= 5) return 16.60;
    if (weight <= 11) return 35.32;
    if (weight <= 17) return 54.04;
    if (weight <= 23) return 72.76;
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

// ==========================================
// 2. CONTROLADOR PRINCIPAL (API ROUTE)
// ==========================================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { weight, weightLbs, dimensions, destination } = body;
    
    // --- 🛡️ SANITIZACIÓN ---
    let finalWeightLbs = parseFloat(weightLbs || weight);
    if (isNaN(finalWeightLbs) || finalWeightLbs <= 0) finalWeightLbs = 1;

    const len = parseFloat(dimensions?.length) || undefined;
    const wid = parseFloat(dimensions?.width) || undefined;
    const hgt = parseFloat(dimensions?.height) || undefined;

    // ================================================================
    // 🔥 CÁLCULO DE PESO COBRABLE (Regla Aerolínea / 139)
    // ================================================================
    // 1. Calculamos peso volumétrico si existen dimensiones
    const volumetricWeight = (len && wid && hgt) 
        ? (len * wid * hgt) / 139 
        : 0;
    
    // 2. Definimos el Peso Cobrable (El mayor entre Real vs Volumétrico)
    // Usamos Math.ceil para redondear hacia arriba (opcional, pero recomendado en logística)
    const chargeableWeight = Math.max(finalWeightLbs, volumetricWeight);

    // ================================================================

    // ==========================================
    // 3. DETECCIÓN DE PAÍS OMNISCIENTE
    // ==========================================
    const c1 = (destination?.country || '').toUpperCase().trim();
    const c2 = (destination?.countryCode || '').toUpperCase().trim();
    const c3 = (destination?.countryName || '').toUpperCase().trim();
    const rawZip = destination?.zip || '';
    const rawCityInput = destination?.city || ''; 

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

    let rawRates: any[] = [];

    // ==========================================
    // 4. EASYPOST
    // ==========================================
    if (targetCountryCode !== 'CU') {
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
            
            // Para EasyPost, enviamos el peso físico y dimensiones. Ellos calculan su propio peso dimensional según sus reglas.
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
    // 5. TARIFAS LOCALES (Gasp Maker Cargo)
    // 🔥 USAMOS 'chargeableWeight' EN LUGAR DE 'finalWeightLbs'
    // ==========================================
    const gmcLogo = '/gaspmakercargoproject.png';

    if(targetCountryCode === 'GD') {
        // Usa el mayor entre peso real y volumen
        const gdPrice = calculateRate_GD(chargeableWeight);
        rawRates.push({ id: 'GMC-GD', carrier: 'Gasp Maker Cargo', service: 'Grenada Direct', price: gdPrice, days: '4-5 days', logo: gmcLogo });
    }
    if (targetCountryCode === 'BB') {
        rawRates.push({ id: 'GMC-BB', carrier: 'Gasp Maker Cargo', service: 'Barbados Direct', price: calculateRate_BB(chargeableWeight), days: '4-5 days', logo: gmcLogo });
    }
    if (targetCountryCode === 'TT') {
        rawRates.push({ id: 'GMC-TT', carrier: 'Gasp Maker Cargo', service: 'Trinidad Direct', price: calculateRate_TT(chargeableWeight), days: '3-5 days', logo: gmcLogo });
    }
    if (targetCountryCode === 'JM') {
        rawRates.push({ id: 'GMC-JM', carrier: 'Gasp Maker Cargo', service: 'Jamaica Direct', price: calculateRate_JM(chargeableWeight), days: '4-5 days', logo: gmcLogo });
    }
    if (targetCountryCode === 'CU') {
        rawRates.push({ id: 'GMC-CU', carrier: 'Gasp Maker Cargo', service: 'Aerovaradero', price: calculateRate_CU(chargeableWeight), days: '15-21 days', logo: gmcLogo });
    }
    if (isStThomas) {
        rawRates.push({ id: 'GMC-VI', carrier: 'Gasp Maker Cargo', service: 'St. Thomas Direct', price: calculateRate_VI(chargeableWeight), days: '4-5 days', logo: gmcLogo });
    }

    // ==========================================
    // 6. FILTRO Y LIMPIEZA FINAL
    // ==========================================
    rawRates = rawRates.filter(rate => {
        if (!rate.price || rate.price < 1) return false;
        if (rate.service && (rate.service.toUpperCase().includes('TRINIDAD DIRECT') || rate.service.toUpperCase().includes('AIR FREIGHT')) && !rate.id.startsWith('GMC')) { 
            return false;
        }
        return true;
    });

    rawRates.sort((a, b) => a.price - b.price);
    
    // Opcional: Devolvemos también el peso cobrable en la respuesta para depuración
    return NextResponse.json({ success: true, rates: rawRates, chargeableWeight });

  } catch (error: any) {
    console.error("API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}