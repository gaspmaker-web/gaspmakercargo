// hooks/useTenantRates.ts
import { useState, useEffect } from 'react';

interface TenantRatesPublic {
  processing_fee_pct: number;
  insurance_pct: number;
  handling_standard: number;
  handling_vip: number;
  ttd_exchange_rate: number;
  storage_per_cuft_per_month: number;
  storage_free_days: number;
  air_countries: string[];
  ocean_countries: string[];
  handling_mini_0_10lbs: number;
  handling_standard_11_50lbs: number;
  handling_heavy_51_150lbs: number;
  handling_pallet_150plus: number;
}

const DEFAULT_RATES: TenantRatesPublic = {
  processing_fee_pct: 0.044,
  insurance_pct: 0.03,
  handling_standard: 0.60,
  handling_vip: 0.50,
  ttd_exchange_rate: 7.30,
  storage_per_cuft_per_month: 2.25,
  storage_free_days: 30,
  air_countries: [],
  ocean_countries: [],
  handling_mini_0_10lbs: 2.50,
  handling_standard_11_50lbs: 5.00,
  handling_heavy_51_150lbs: 12.50,
  handling_pallet_150plus: 30.00,
};

export function useTenantRates(): TenantRatesPublic {
  const [rates, setRates] = useState<TenantRatesPublic>(DEFAULT_RATES);

  useEffect(() => {
    fetch('/api/tenant/rates-public')
      .then(r => r.json())
      .then(data => setRates({ ...DEFAULT_RATES, ...data }))
      .catch(() => {});
  }, []);

  return rates;
}