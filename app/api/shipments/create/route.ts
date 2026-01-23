import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { sendPaymentReceiptEmail } from '@/lib/notifications';

// --- Tarifas ---
const STORAGE_FREE_DAYS = 30;
const STORAGE_RATE_PER_CFT = 2.25;

// Forzamos dinamismo para evitar caché en Vercel/Next.js
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { 
        packageIds, 
        type, // 'WAREHOUSE_PICKUP' o 'CONSOLIDATION'
        scheduledDate, scheduledTime,
        // Eliminamos 'discount' de la destructuración para no confundir
        selectedCourier, courierService, totalWeight, subtotal, processingFee, totalPaid, stripePaymentId, shippingAddress
    } = body;

    if (!packageIds || packageIds.length === 0) {
        return NextResponse.json({ message: "No has seleccionado ningún paquete." }, { status: 400 });
    }

    // 🚨 VALIDACIÓN DE SEGURIDAD: Evitar doble procesamiento
    const existingUsage = await prisma.package.findFirst({
        where: {
            id: { in: packageIds },
            OR: [
                { status: 'EN_PROCESO_ENVIO' },
                { status: 'PENDIENTE_RETIRO' },
                { status: 'ENTREGADO' },
                { consolidatedShipmentId: { not: null } }
            ]
        }
    });

    if (existingUsage) {
        return NextResponse.json({ 
            message: "⚠️ Error: Uno o más paquetes ya fueron procesados. Por favor actualiza la página." 
        }, { status: 409 });
    }

    // =======================================================================
    // 🚚 CASO 1: RECOGIDA EN BODEGA (PICKUP)
    // =======================================================================
    if (type === 'WAREHOUSE_PICKUP') {
        const packages = await prisma.package.findMany({ where: { id: { in: packageIds }, userId: session.user.id } });
        
        let calculatedTotal = 0;
        
        // 🔥 LÓGICA CORREGIDA: RESPETAR SI YA ESTÁ PAGADO
        packages.forEach(pkg => {
            const now = new Date();
            // Handling Fee: <50lb=$5, <150lb=$15, >150lb=$35
            let handling = (pkg.weightLbs || 0) <= 50 ? 5.00 : (pkg.weightLbs || 0) <= 150 ? 15.00 : 35.00;

            let storage = 0;
            const paidUntil = pkg.storagePaidUntil ? new Date(pkg.storagePaidUntil) : null;
            
            // Medidas seguras
            const length = Number(pkg.lengthIn) || 12;
            const width = Number(pkg.widthIn) || 12;
            const height = Number(pkg.heightIn) || 10;
            const vol = (length * width * height) / 1728;

            if (paidUntil) {
                 // ✅ SI YA PAGÓ: Solo cobramos si hay días nuevos pendientes
                 // Si pagó hoy (paidUntil >= now aprox), la deuda es 0.
                 const diffSincePaid = now.getTime() - paidUntil.getTime();
                 const daysPending = Math.floor(diffSincePaid / (1000 * 60 * 60 * 24));
                 
                 if (daysPending > 0) {
                     const dailyRate = (vol * STORAGE_RATE_PER_CFT) / 30;
                     storage = daysPending * dailyRate;
                 } else {
                     storage = 0; // Está al día, no cobramos storage extra
                 }
            } else {
                 // ❌ NUNCA PAGÓ: Cálculo normal
                 const daysTotal = Math.ceil(Math.abs(now.getTime() - new Date(pkg.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                 if (daysTotal > STORAGE_FREE_DAYS) {
                     const overdueDays = daysTotal - STORAGE_FREE_DAYS;
                     const dailyRate = (vol * STORAGE_RATE_PER_CFT) / 30;
                     storage = overdueDays * dailyRate;
                 }
            }
            
            calculatedTotal += (handling + storage);
        });

        // Crear la factura de Pickup
        const pickupShipment = await prisma.consolidatedShipment.create({
            data: {
                userId: session.user.id,
                gmcShipmentNumber: `PICKUP-${Date.now().toString().slice(-6)}`,
                status: 'PENDIENTE_PAGO',
                destinationCountryCode: 'USA',
                serviceType: 'STORAGE_FEE', 
                courierService: `Cita: ${scheduledDate} ${scheduledTime}`,
                totalAmount: parseFloat(calculatedTotal.toFixed(2)),
                weightLbs: packages.reduce((acc, p) => acc + (p.weightLbs || 0), 0),
                packages: { connect: packageIds.map((id: string) => ({ id })) }
            }
        });

        // Actualizar paquetes
        await prisma.package.updateMany({
            where: { id: { in: packageIds } },
            data: { 
                status: 'PENDIENTE_RETIRO',        
                selectedCourier: 'CLIENTE_RETIRO', 
                courierService: `Cita: ${scheduledDate} ${scheduledTime}` 
            }
        });

        return NextResponse.json({ success: true, shipmentId: pickupShipment.id });
    }

    // =======================================================================
    // ✈️ CASO 2: CONSOLIDACIÓN / ENVÍO
    // =======================================================================
    const shipmentNumber = `GMC-SHIP-${Math.floor(100000 + Math.random() * 900000)}`;
    const finalServiceType = packageIds.length > 1 ? 'CONSOLIDATION' : 'SHIPPING_INTL';

    const shipment = await prisma.consolidatedShipment.create({
        data: {
            userId: session.user.id,
            gmcShipmentNumber: shipmentNumber,
            status: 'PAGADO', // Asumimos pagado si viene de Stripe directo
            destinationCountryCode: 'INTL', 
            serviceType: finalServiceType,
            
            subtotalAmount: subtotal,
            processingFee: processingFee,
            // 🚨 CORRECCIÓN: Eliminamos 'discountAmount' porque no existe en la BD
            // discountAmount: discount || 0, 
            totalAmount: totalPaid,
            paymentId: stripePaymentId,
            selectedCourier,
            courierService,
            weightLbs: totalWeight,
            packages: { connect: packageIds.map((id: string) => ({ id })) }
        }
    });

    // 💰 SISTEMA DE REFERIDOS: "GIVE $25"
    // Lógica: Si el Subtotal es >= $100 y es su PRIMER envío, premiamos al padrino.
    if ((subtotal || 0) >= 100) {
        try {
            // 1. Verificamos si este es realmente el primer envío pagado del usuario
            // (Excluimos el actual que acabamos de crear)
            const previousShipmentsCount = await prisma.consolidatedShipment.count({
                where: {
                    userId: session.user.id,
                    status: 'PAGADO',
                    id: { not: shipment.id } 
                }
            });

            if (previousShipmentsCount === 0) {
                // 2. Buscamos si el usuario tiene un Padrino (referredBy)
                const currentUser = await prisma.user.findUnique({
                    where: { id: session.user.id },
                    select: { referredBy: true, email: true }
                });

                if (currentUser?.referredBy) {
                    // 3. Buscamos al Padrino por su código
                    const referrerUser = await prisma.user.findFirst({
                        where: { referralCode: currentUser.referredBy }
                    });

                    // 4. PREMIO: Sumamos $25 a la billetera del Padrino
                    if (referrerUser) {
                        await prisma.user.update({
                            where: { id: referrerUser.id },
                            data: {
                                walletBalance: { increment: 25.00 }
                            }
                        });
                        console.log(`💰 REFERRAL REWARD: $25 added to ${referrerUser.email} for referring ${currentUser.email}`);
                    }
                }
            }
        } catch (error) {
            console.error("Error procesando recompensa de referidos:", error);
            // No detenemos el flujo principal si falla la recompensa
        }
    }

    await prisma.package.updateMany({
        where: { id: { in: packageIds } },
        data: { 
            status: 'EN_PROCESO_ENVIO', 
            selectedCourier, 
            courierService 
        }
    });

    try {
        const safeTotal = typeof totalPaid === 'number' ? totalPaid : 0;
        const typeLabel = packageIds.length > 1 ? "Consolidación" : "Envío Individual";
        
        await sendPaymentReceiptEmail(
            session.user.email || '', 
            session.user.name || 'Cliente', 
            `Envío Internacional (${selectedCourier})`, 
            safeTotal,
            shipment.gmcShipmentNumber, 
            `${typeLabel} de ${packageIds.length} paquete(s). Destino: ${shippingAddress}`
        );
    } catch (e) { console.error("Error email:", e); }

    return NextResponse.json({ success: true, shipmentId: shipment.id });

  } catch (error: any) {
    console.error("Error creando envío:", error);
    return NextResponse.json({ message: "Error interno al crear envío." }, { status: 500 });
  }
}