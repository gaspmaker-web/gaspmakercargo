import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { getTenant } = await import('@/lib/tenant');
    const tenant = await getTenant();
    return NextResponse.json({ tenant });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ tenant: null });
  }
}