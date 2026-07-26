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
    
    return NextResponse.json({
      processing_fee_pct: Number(rates['processing_fee_pct'] ?? 0.044),
      insurance_pct: Number(rates['insurance_pct'] ?? 0.03),
      handling_standard: Number(rates['handling_standard'] ?? 0.60),
      handling_vip: Number(rates['handling_vip'] ?? 0.50),
      ttd_exchange_rate: Number(rates['ttd_exchange_rate'] ?? 7.30),
      storage_per_cuft_per_month: Number(rates['storage_per_cuft_per_month'] ?? 2.25),
      storage_free_days: Number(rates['storage_free_days'] ?? 30),
    });
  } catch (error) {
    console.error('Error loading public rates:', error);
    return NextResponse.json({ processing_fee_pct: 0.044, insurance_pct: 0.03 });
  }
}