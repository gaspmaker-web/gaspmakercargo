import { customAlphabet } from 'nanoid';

// Generadores de IDs
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

export function generateLockerNumber(countryCode: string): string {
    const code = countryCode.toUpperCase();
    const digits = Math.floor(10000 + Math.random() * 90000).toString();
    return `${code}-${digits}`; 
}

export const generateGmcTracking = (countryCode: string): string => {
    const prefix = 'GM-' + countryCode.toUpperCase(); 
    return prefix + '-' + nanoid(10); 
};

export function calculateVolumeFt3(l?: number | null, w?: number | null, h?: number | null): string {
    if (!l || !w || !h) return "0.00";
    const vol = (l * w * h) / 1728;
    return vol.toFixed(2);
}

// ==========================================
// CALCULADORA DE ALMACENAJE (CORREGIDA)
// ==========================================
export const calculateStorageCost = (pkg: { createdAt: Date | string, storagePaidUntil?: Date | string | null, lengthIn?: number | null, widthIn?: number | null, heightIn?: number | null }) => {
    const entryDate = new Date(pkg.createdAt);
    const today = new Date();
    
    // 1. Fin de los 30 días gratis
    const freePeriodEnd = new Date(entryDate);
    freePeriodEnd.setDate(freePeriodEnd.getDate() + 30);

    // 2. Determinar fecha de inicio de deuda
    let debtStartDate = freePeriodEnd;
    
    if (pkg.storagePaidUntil) {
        const paidUntil = new Date(pkg.storagePaidUntil);
        // Si la fecha pagada es posterior al periodo gratis, esa es la nueva base.
        if (paidUntil > freePeriodEnd) {
            debtStartDate = paidUntil;
        }
    }

    // 3. --- MARGEN DE TOLERANCIA ---
    // Si la diferencia es menor a 24 horas (86400000 ms), consideramos que está al día.
    const diffTimeRaw = today.getTime() - debtStartDate.getTime();
    
    if (diffTimeRaw <= 86400000) { 
        // Retornamos costo 0 para que desaparezca el banner rojo
        return { 
            days: Math.ceil((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)), 
            overdueDays: 0, 
            cost: 0, 
            volume: 0 
        };
    }

    // 4. Calcular días vencidos reales
    const overdueDays = Math.ceil(diffTimeRaw / (1000 * 60 * 60 * 24));
    
    // 5. Calcular volumen
    const l = pkg.lengthIn || 0;
    const w = pkg.widthIn || 0;
    const h = pkg.heightIn || 0;
    const volumeFt3 = (l * w * h) / 1728;

    // 6. Tarifa: $2.25 por ft³ (mensual)
    const monthsOverdue = Math.ceil(overdueDays / 30);
    const cost = volumeFt3 * 2.25 * monthsOverdue;

    const totalDaysInWarehouse = Math.ceil((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

    return { 
        days: totalDaysInWarehouse, 
        overdueDays, 
        cost: parseFloat(cost.toFixed(2)), 
        volume: parseFloat(volumeFt3.toFixed(2)) 
    };
};