import { NextRequest, NextResponse } from 'next/server';
import { invalidateTenantRatesCache } from '@/lib/tenant-rates';
import { getTenantId } from '@/lib/tenant-cache';

export async function POST(req: NextRequest) {
  const slug = process.env.TENANT_SLUG || 'gaspmaker';
  const tenantId = await getTenantId(slug);
  if (tenantId) {
    await invalidateTenantRatesCache(tenantId);
  }
  return NextResponse.json({ ok: true, tenantId });
}