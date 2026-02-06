import { NextResponse } from 'next/server';
import easypost from '@/lib/easypost';

// 🚨 IMPORTANTE: Esto obliga a Next.js a NO usar caché nunca.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ==========================================
// 🗺️ DICCIONARIO DE CAPITALES (Para Calculadora)
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
    // Caribe
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
// 1. TARIFAS LOCALES (Gasp Maker Cargo)
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
    if (weight <= 10) return 1.00;
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
    
    // --- 🛡️ SANITIZACIÓN DE DATOS ---
    let finalWeightLbs = parseFloat(weightLbs || weight);
    if (isNaN(finalWeightLbs) || finalWeightLbs <= 0) finalWeightLbs = 1;

    const len = parseFloat(dimensions?.length) || 12;
    const wid = parseFloat(dimensions?.width) || 12;
    const hgt = parseFloat(dimensions?.height) || 12;

    // ==========================================
    // 3. DETECCIÓN DE PAÍS OMNISCIENTE 👁️
    // ==========================================
    const c1 = (destination?.country || '').toUpperCase().trim();
    const c2 = (destination?.countryCode || '').toUpperCase().trim();
    const c3 = (destination?.countryName || '').toUpperCase().trim();
    const rawZip = destination?.zip || '';
    const rawCityInput = destination?.city || ''; // Capturamos lo que venga en city

    let targetCountryCode = 'US'; 

    // A. Regla especial Cuba
    if (rawZip === '40100' || [c1, c2, c3].some(c => c.includes('CUBA'))) {
        targetCountryCode = 'CU';
    } 
    else {
        // B. Buscar código de 2 letras
        const codeCandidates = [c1, c2, c3].filter(c => c.length === 2 && c !== 'US');
        if (codeCandidates.length > 0) {
            targetCountryCode = codeCandidates[0];
        } else {
            // C. Búsqueda por Nombre Completo
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
    // 4. EASYPOST (Integración Robusta con Limpieza)
    // ==========================================
    if (targetCountryCode !== 'CU') {
        try {
            let finalState = destination?.state;
            let finalCity = rawCityInput;
            let finalZip = rawZip ? rawZip.replace(/[^0-9-]/g, '') : undefined;

            // 🟢 CASO 1: CALCULADORA (Ciudad Vacía) -> Usar Defaults
            if (!finalCity || finalCity.trim() === '') {
                const defaultCap = DEFAULT_CAPITALS[targetCountryCode];
                if (defaultCap) {
                    finalCity = defaultCap.city;
                    if (!finalZip && defaultCap.zip) finalZip = defaultCap.zip;
                    if (!finalState && defaultCap.state) finalState = defaultCap.state;
                } else {
                    finalCity = 'City'; // Fallback extremo
                }
            }

            // 🔵 CASO 2: PAGAR FACTURAS USA (Ciudad "Sucia" ej: "Bronx, NY 10458")
            if (easyPostCountryCode === 'US') {
                const fullAddressString = `${rawCityInput} ${rawZip}`.replace(/\s+/g, ' ').trim();

                // Regex: Busca (Texto Ciudad) + (2 Letras Estado) + (5 Dígitos Zip)
                const addressMatch = fullAddressString.match(/^(.*?)[,\s]+([A-Za-z]{2})[\s,]+(\d{5}(?:-\d{4})?)/);

                if (addressMatch) {
                    finalCity = addressMatch[1].trim();        // "Bronx"
                    finalState = addressMatch[2].toUpperCase();// "NY"
                    finalZip = addressMatch[3];                // "10458"
                } else {
                    // Fallback manual si el Regex falla
                    if (!finalState && fullAddressString.toUpperCase().includes('FL')) finalState = 'FL';
                    if (!finalState && fullAddressString.toUpperCase().includes('NY')) finalState = 'NY';
                    
                    if (finalZip) finalCity = finalCity.replace(finalZip, '');
                    if (finalState) finalCity = finalCity.replace(finalState, '');
                    finalCity = finalCity.replace(/,/g, '').trim();
                }

                // Default de seguridad
                if (!finalCity || finalCity.length < 2) finalCity = 'Miami';
                if (!finalState) finalState = 'FL';
                if (!finalZip || finalZip.length < 5) finalZip = '33166';
            }

            const safeZip = (finalZip && finalZip.length >= 3) ? finalZip : undefined;
            
            // Log ligero para depuración
            console.log(`🚀 API Rate Check: ${easyPostCountryCode} -> ${finalCity}, ${finalState} ${safeZip}`);

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
            
            const parcel = await easypost.Parcel.create({
                length: len, 
                width: wid, 
                height: hgt, 
                weight: finalWeightLbs * 16, // EasyPost usa ONZAS
            });
            
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

                    // 💰 APLICANDO 30% DE MARGEN SOLO A EASYPOST
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
            console.warn(`⚠️ EasyPost Warning (Destino: ${targetCountryCode}):`, e.message); 
        }
    }

    // ==========================================
    // 5. TARIFAS LOCALES (Gasp Maker Cargo)
    // ==========================================
    const gmcLogo = '/gaspmakercargoproject.png';

    if (targetCountryCode === 'BB') {
        rawRates.push({ id: 'GMC-BB', carrier: 'Gasp Maker Cargo', service: 'Barbados Direct', price: calculateRate_BB(finalWeightLbs), days: '4-5 days', logo: gmcLogo });
    }
    if (targetCountryCode === 'TT') {
        rawRates.push({ id: 'GMC-TT', carrier: 'Gasp Maker Cargo', service: 'Trinidad Direct', price: calculateRate_TT(finalWeightLbs), days: '3-5 days', logo: gmcLogo });
    }
    if (targetCountryCode === 'JM') {
        rawRates.push({ id: 'GMC-JM', carrier: 'Gasp Maker Cargo', service: 'Jamaica Direct', price: calculateRate_JM(finalWeightLbs), days: '4-5 days', logo: gmcLogo });
    }
    if (targetCountryCode === 'GD') {
        rawRates.push({ id: 'GMC-GD', carrier: 'Gasp Maker Cargo', service: 'Grenada Direct', price: calculateRate_GD(finalWeightLbs), days: '4-5 days', logo: gmcLogo });
    }
    if (targetCountryCode === 'CU') {
        rawRates.push({ id: 'GMC-CU', carrier: 'Gasp Maker Cargo', service: 'Aerovaradero', price: calculateRate_CU(finalWeightLbs), days: '15-21 days', logo: gmcLogo });
    }
    if (isStThomas) {
        rawRates.push({ id: 'GMC-VI', carrier: 'Gasp Maker Cargo', service: 'St. Thomas Direct', price: calculateRate_VI(finalWeightLbs), days: '4-5 days', logo: gmcLogo });
    }

    // ==========================================
    // 6. FILTRO Y LIMPIEZA FINAL
    // ==========================================
    rawRates = rawRates.filter(rate => {
        if (!rate.price || rate.price < 1) return false;
        
        if (rate.service && 
            (rate.service.toUpperCase().includes('TRINIDAD DIRECT') || rate.service.toUpperCase().includes('AIR FREIGHT')) && 
            !rate.id.startsWith('GMC')) { 
            return false;
        }
        return true;
    });

    rawRates.sort((a, b) => a.price - b.price);

    return NextResponse.json({ success: true, rates: rawRates });

  } catch (error: any) {
    console.error("🔥 API CRITICAL ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}