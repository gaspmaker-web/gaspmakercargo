import { NextResponse } from 'next/server';
import easypost from '@/lib/easypost';

// 🚨 IMPORTANTE: Esto obliga a Next.js a NO usar caché nunca.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    
    // --- 🛡️ SANITIZACIÓN DE DATOS (Seguridad Nivel 1) ---
    // Aseguramos que el peso y las medidas sean números válidos para evitar crashes.
    let finalWeightLbs = parseFloat(weightLbs || weight);
    if (isNaN(finalWeightLbs) || finalWeightLbs <= 0) finalWeightLbs = 1;

    // Valores por defecto seguros si faltan dimensiones
    const len = parseFloat(dimensions?.length) || 12;
    const wid = parseFloat(dimensions?.width) || 12;
    const hgt = parseFloat(dimensions?.height) || 12;

    // ==========================================
    // 3. DETECCIÓN DE PAÍS OMNISCIENTE 👁️
    // ==========================================
    const c1 = (destination?.country || '').toUpperCase().trim();
    const c2 = (destination?.countryCode || '').toUpperCase().trim();
    const c3 = (destination?.countryName || '').toUpperCase().trim();
    const zip = destination?.zip || '';
    
    let targetCountryCode = 'US'; 

    // A. Regla especial Cuba
    if (zip === '40100' || [c1, c2, c3].some(c => c.includes('CUBA'))) {
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

    const isStThomas = [c1, c2, c3].some(c => c === 'VI' || c.includes('VIRGIN')) || zip.startsWith('008');
    const easyPostCountryCode = isStThomas ? 'US' : targetCountryCode;

    let rawRates: any[] = [];

    // ==========================================
    // 4. EASYPOST (Integración Robusta)
    // ==========================================
    if (targetCountryCode !== 'CU') {
        try {
            const fromAddress = await easypost.Address.create({
                company: 'Gasp Maker Cargo', street1: '1861 NW 22nd St', city: 'Miami', state: 'FL', zip: '33142', country: 'US', phone: '786-282-0763',
            });
            
            // Truco de Seguridad: Si el ZIP es inválido o muy corto, enviamos undefined
            // para que EasyPost intente cotizar solo con Ciudad/País en lugar de lanzar error.
            const safeZip = (zip && zip.length >= 3) ? zip : undefined;

            const toAddress = await easypost.Address.create({
                name: destination?.name || 'Cliente', 
                street1: destination?.address || 'City Center', 
                city: destination?.city || destination?.state || 'City', 
                state: destination?.state, 
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
                        price: parseFloat(priceWithMarkup.toFixed(2)), // Usamos el precio con margen
                        currency: rate.currency,
                        days: rate.delivery_days ? `${rate.delivery_days} days` : '3-7 days', 
                        logo: logoUrl 
                    };
                });
                rawRates.push(...easyPostRates);
            }
        } catch (e: any) { 
            // 🛡️ DEFENSA ACTIVA:
            // Si EasyPost falla (ej: medidas 121 in), NO rompemos la API.
            // Solo logueamos el error y continuamos para mostrar las tarifas locales si existen.
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
        // Eliminamos filtro de precio mínimo arbitrario, solo seguridad básica
        if (!rate.price || rate.price < 1) return false;
        
        // Evitar duplicados de servicios locales si ya se inyectaron manualmente
        if (rate.service && 
            (rate.service.toUpperCase().includes('TRINIDAD DIRECT') || rate.service.toUpperCase().includes('AIR FREIGHT')) && 
            !rate.id.startsWith('GMC')) { 
            return false;
        }
        return true;
    });

    // 🔥 SIN FALLBACK: Si rawRates está vacío, retornamos array vacío.
    // El frontend se encargará de mostrar la alerta: "No hay rutas disponibles, contactar soporte".
    // Esto es más seguro que inventar un precio.

    rawRates.sort((a, b) => a.price - b.price);

    return NextResponse.json({ success: true, rates: rawRates });

  } catch (error: any) {
    console.error("🔥 API CRITICAL ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}