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
    // 2. Configuración de Tarifas y Límites
    const FREE_DAYS = 30;
    const PRICE_PER_CUBIC_FOOT = 2.25; // Precio mensual
    const PRICE_PER_DAY = PRICE_PER_CUBIC_FOOT / 30; // Precio diario (~$0.075)
    
    // 🔥 LÓGICA ENTERPRISE: Límite para bloqueo
    const ENTERPRISE_LIMIT = 1.00; 

    // 3. Buscar paquetes "En Almacén" que NO hayan sido entregados
    const packages = await prisma.package.findMany({
      where: {
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
        
        // Calcular Volumen (Pies Cúbicos)
        const l = pkg.lengthIn || 12;
        const w = pkg.widthIn || 12;
        const h = pkg.heightIn || 12;
        const cubicFeet = (l * w * h) / 1728;

        // Costo del día de hoy
        const dailyFee = cubicFeet * PRICE_PER_DAY;

        // 🔥 CALCULAMOS LA NUEVA DEUDA EXACTA
        const currentDebt = pkg.storageDebt || 0;
        const newTotalDebt = currentDebt + dailyFee;

        // 🔥 DECISIÓN DE BLOQUEO: Solo si supera o iguala $1.00
        const shouldBlock = newTotalDebt >= ENTERPRISE_LIMIT;

        // Actualizar la base de datos
        await prisma.package.update({
          where: { id: pkg.id },
          data: { 
            storageDebt: newTotalDebt, // Actualizamos con el nuevo saldo
            isBlocked: shouldBlock     // El paquete permanece libre si es menor a $1.00
          }
        });
        
        updatedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Auditoría finalizada. ${updatedCount} paquetes procesados.` 
    });

  } catch (error) {
    console.error("Error en Cron Job:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}