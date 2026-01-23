import { NextResponse } from "next/server";

// 👇 VACUNA 1: Forzar modo dinámico (Vital para Cron Jobs)
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // 👇 VACUNA 2: Lazy Loading de la base de datos
  const prisma = (await import("@/lib/prisma")).default;

  // 1. Seguridad: Verificar que solo Vercel (o tú) pueda llamar a este robot
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // 2. Configuración de Tarifas
    const FREE_DAYS = 30;
    const PRICE_PER_CUBIC_FOOT = 2.25; // Precio mensual
    const PRICE_PER_DAY = PRICE_PER_CUBIC_FOOT / 30; // Precio diario (~$0.075)

    // 3. Buscar paquetes "En Almacén" que NO hayan sido entregados
    const packages = await prisma.package.findMany({
      where: {
        // ✅ CORREGIDO: Ahora incluimos "RECIBIDO_MIAMI" que es tu estado real
        status: { in: ["RECIBIDO", "EN_ALMACEN", "RECIBIDO_MIAMI"] }, 
      }
    });

    let updatedCount = 0;
    const today = new Date();

    // 4. Procesar cada paquete
    for (const pkg of packages) {
      // Calcular días desde que llegó
      const arrivalDate = new Date(pkg.createdAt);
      const diffTime = Math.abs(today.getTime() - arrivalDate.getTime());
      const daysInWarehouse = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Si ya pasó los días gratis... COBRAR
      if (daysInWarehouse > FREE_DAYS) {
        
        // Calcular Volumen (Pies Cúbicos) = (L x W x H) / 1728
        // Si faltan medidas, asumimos mínimo 1 pie cúbico
        const l = pkg.lengthIn || 12;
        const w = pkg.widthIn || 12;
        const h = pkg.heightIn || 12;
        const cubicFeet = (l * w * h) / 1728;

        // Costo del día de hoy
        const dailyFee = cubicFeet * PRICE_PER_DAY;

        // Actualizar la deuda en la BD
        await prisma.package.update({
          where: { id: pkg.id },
          data: { 
            storageDebt: { increment: dailyFee } // Sumar al saldo existente
          }
        });
        
        updatedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Auditoría finalizada. ${updatedCount} paquetes actualizados con deuda.` 
    });

  } catch (error) {
    console.error("Error en Cron Job:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}