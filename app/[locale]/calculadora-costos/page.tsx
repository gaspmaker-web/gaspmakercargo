import CalculadoraClient from './CalculadoraClient';
import { getTenantId } from '@/lib/tenant-cache';
import { getTenantRates } from '@/lib/tenant-rates';
import { ALL_COUNTRIES } from '@/lib/countries';

export const dynamic = 'force-dynamic';

export default async function CalculatorPage() {
  // Cargar países en el servidor
  const slug = process.env.TENANT_SLUG || 'gaspmaker';
  const tenantId = await getTenantId(slug);
  
  let airCountries: string[] = [];
  let oceanCountries: string[] = [];

  if (tenantId) {
    const rates = await getTenantRates(tenantId);
    
    airCountries = Object.keys(rates)
      .filter(k => k.startsWith('air_per_lb__') && Number(rates[k]) > 0)
      .map(k => k.replace('air_per_lb__', ''));

    oceanCountries = Object.keys(rates)
      .filter(k => k.startsWith('ocean_per_cuft__') && Number(rates[k]) > 0)
      .map(k => k.replace('ocean_per_cuft__', ''));
  }

  return (
    <CalculadoraClient 
      initialAirCountries={airCountries}
      initialOceanCountries={oceanCountries}
    />
  );
}