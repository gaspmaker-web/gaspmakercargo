// lib/tenant-rates.ts
// 🏢 CARGOOS: Motor de tarifas dinámico por tenant
// Todos los archivos llaman esta función en vez de valores hardcodeados

import prisma from '@/lib/prisma';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const CACHE_TTL = 300; // 5 minutos

// ==========================================
// 🔍 GET ALL RATES FOR A TENANT
// ==========================================
export async function getTenantRates(tenantId: string): Promise<Record<string, number>> {
  try {
    // 1. Buscar en cache
    const cacheKey = `rates:${tenantId}`;
    const cached = await redis.get<Record<string, number>>(cacheKey);
    if (cached) return cached;

    // 2. Buscar en BD
    const rates = await prisma.tenantRate.findMany({
      where: { tenantId },
    });

    // 3. Convertir a objeto key-value
    // Key format: concept__countryCode (ej: air_per_lb__DO) o concept (ej: insurance_pct)
    const ratesMap: Record<string, number> = {};
    rates.forEach(rate => {
      const key = rate.countryCode 
        ? `${rate.concept}__${rate.countryCode}` 
        : rate.concept;
      ratesMap[key] = Number(rate.value);
    });

    // 4. Guardar en cache
    await redis.set(cacheKey, ratesMap, { ex: CACHE_TTL });

    return ratesMap;
  } catch (error) {
    console.error('Error getting tenant rates:', error);
    return {};
  }
}

// ==========================================
// 🔍 GET SINGLE RATE
// ==========================================
export async function getTenantRate(
  tenantId: string,
  concept: string,
  countryCode?: string
): Promise<number | null> {
  try {
    const rates = await getTenantRates(tenantId);
    const key = countryCode ? `${concept}__${countryCode}` : concept;
    return rates[key] ?? null;
  } catch {
    return null;
  }
}

// ==========================================
// 🔄 INVALIDAR CACHE (llamar cuando se guardan tarifas)
// ==========================================
export async function invalidateTenantRatesCache(tenantId: string): Promise<void> {
  try {
    await redis.del(`rates:${tenantId}`);
  } catch (error) {
    console.error('Error invalidating rates cache:', error);
  }
}

// ==========================================
// 💰 HELPERS ESPECÍFICOS — para uso directo
// ==========================================
export async function getInsurancePct(tenantId: string): Promise<number> {
  return (await getTenantRate(tenantId, 'insurance_pct')) ?? 0.03;
}

export async function getHandlingFee(tenantId: string, isVip: boolean): Promise<number> {
  const concept = isVip ? 'handling_vip' : 'handling_standard';
  return (await getTenantRate(tenantId, concept)) ?? (isVip ? 0.50 : 0.60);
}

export async function getTTDExchangeRate(tenantId: string): Promise<number> {
  return (await getTenantRate(tenantId, 'ttd_exchange_rate')) ?? 7.30;
}

export async function getEasyPostMarkup(tenantId: string): Promise<number> {
  return (await getTenantRate(tenantId, 'easypost_markup')) ?? 1.30;
}

export async function getAirRatePerLb(tenantId: string, countryCode: string): Promise<number | null> {
  return await getTenantRate(tenantId, 'air_per_lb', countryCode);
}

export async function getOceanRatePerCuft(tenantId: string, countryCode: string): Promise<number | null> {
  return await getTenantRate(tenantId, 'ocean_per_cuft', countryCode);
}

export async function getMinRate(tenantId: string, countryCode: string): Promise<number | null> {
  return await getTenantRate(tenantId, 'min_rate', countryCode);
}

export async function getHazmatPrepFee(tenantId: string): Promise<number> {
  return (await getTenantRate(tenantId, 'hazmat_prep_fee')) ?? 120.00;
}

export async function getHazmatShippingLineFee(tenantId: string): Promise<number> {
  return (await getTenantRate(tenantId, 'hazmat_shipping_line_fee')) ?? 180.00;
}

export async function getAirHazmatFee(tenantId: string): Promise<number> {
  return (await getTenantRate(tenantId, 'air_hazmat_fee')) ?? 275.00;
}

export async function getEeiFee(tenantId: string): Promise<number> {
  return (await getTenantRate(tenantId, 'eei_fee')) ?? 40.00;
}

export async function getStoragePerCuftPerMonth(tenantId: string): Promise<number> {
  return (await getTenantRate(tenantId, 'storage_per_cuft_per_month')) ?? 2.25;
}

export async function getStorageFreeDays(tenantId: string): Promise<number> {
  return (await getTenantRate(tenantId, 'storage_free_days')) ?? 30;
}