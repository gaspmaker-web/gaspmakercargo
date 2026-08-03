import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { getTenantId } = await import('@/lib/tenant-cache');
    const { getTenantRates } = await import('@/lib/tenant-rates');
    
    const slug = process.env.TENANT_SLUG || 'gaspmaker';
    const tenantId = await getTenantId(slug);
    
    if (!tenantId) {
      return NextResponse.json({ processing_fee_pct: 0.044, insurance_pct: 0.03 });
    }

    const rates = await getTenantRates(tenantId);
    
    const airCountries = Object.entries(rates)
  .filter(([k, v]) => k.startsWith('air_per_lb__') && Number(v) > 0)
  .map(([k]) => k.replace('air_per_lb__', ''));

const oceanCountries = Object.entries(rates)
  .filter(([k, v]) => k.startsWith('ocean_per_cuft__') && Number(v) > 0)
  .map(([k]) => k.replace('ocean_per_cuft__', ''));

return NextResponse.json({
  processing_fee_pct: Number(rates['processing_fee_pct'] ?? 0.044),
  insurance_pct: Number(rates['insurance_pct'] ?? 0.03),
  handling_standard: Number(rates['handling_standard'] ?? 0.60),
  handling_vip: Number(rates['handling_vip'] ?? 0.50),
  handling_mini_0_10lbs: Number(rates['handling_mini_0_10lbs'] ?? 2.50),
  handling_standard_11_50lbs: Number(rates['handling_standard_11_50lbs'] ?? 5.00),
  handling_heavy_51_150lbs: Number(rates['handling_heavy_51_150lbs'] ?? 12.50),
  handling_pallet_150plus: Number(rates['handling_pallet_150plus'] ?? 30.00),
  ttd_exchange_rate: Number(rates['ttd_exchange_rate'] ?? 7.30),
  storage_per_cuft_per_month: Number(rates['storage_per_cuft_per_month'] ?? 2.25),
  storage_free_days: Number(rates['storage_free_days'] ?? 30),
  mailbox_basic_monthly: Number(rates['mailbox_basic_monthly'] ?? 7.99),
  mailbox_premium_monthly: Number(rates['mailbox_premium_monthly'] ?? 14.99),
  mailbox_scan_per_envelope: Number(rates['mailbox_scan_per_envelope'] ?? 1.50),
  mailbox_shred_per_envelope: Number(rates['mailbox_shred_per_envelope'] ?? 0.50),
  air_countries: airCountries,
  ocean_countries: oceanCountries,
  // 🔥 LOCAL DELIVERY
  local_base_radius_miles: Number(rates['local_base_radius_miles'] ?? 10),
  local_per_mile_car_suv: Number(rates['local_per_mile_car_suv'] ?? 1.25),
  local_per_mile_minivan: Number(rates['local_per_mile_minivan'] ?? 1.50),
  local_per_mile_cargo_van: Number(rates['local_per_mile_cargo_van'] ?? 1.75),
  local_per_mile_box_truck: Number(rates['local_per_mile_box_truck'] ?? 2.50),
  local_pre_built_pallet_flat: Number(rates['local_pre_built_pallet_flat'] ?? 95),
  local_pre_built_radius_miles: Number(rates['local_pre_built_radius_miles'] ?? 20),
  local_pallet_cargo_van_1: Number(rates['local_pallet_cargo_van_1'] ?? 95),
  local_pallet_cargo_van_2: Number(rates['local_pallet_cargo_van_2'] ?? 125),
  local_pallet_box_truck: Number(rates['local_pallet_box_truck'] ?? 175),
});
} catch (error) {
    console.error('Error loading public rates:', error);
    return NextResponse.json({ 
      processing_fee_pct: 0.044, 
      insurance_pct: 0.03,
      air_countries: [],
      ocean_countries: [],
    });
  }
}