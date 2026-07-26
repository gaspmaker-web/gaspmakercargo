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