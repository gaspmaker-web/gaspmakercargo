import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic'; 

export async function GET() {
    try {
        const count = await prisma.package.count({
            where: {
                status: {
                    in: ['PRE_ALERTA', 'PRE_ALERTADO']
                }
            }
        });

        return NextResponse.json({ count });
    } catch (error) {
        console.error("Error contando pre-alertas:", error);
        return NextResponse.json({ count: 0 }, { status: 500 });
    }
}