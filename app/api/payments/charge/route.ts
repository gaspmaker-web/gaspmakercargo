import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const { 
        amountNet, 
        paymentMethodId, 
        description, 
        serviceType, 
        packageIds, 
        pickupId,   
        billIds,    
        billDetails, // El desglose que enviamos desde el frontend
        selectedCourier, 
        courierService   
    } = await req.json();

    if (!amountNet || !paymentMethodId) {
        return NextResponse.json({ message: "Faltan datos de pago" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || !user.stripeCustomerId) {
        return NextResponse.json({ message: "Usuario no configurado para pagos" }, { status: 400 });
    }

    const savedCard = await prisma.paymentMethod.findUnique({ 
        where: { id: paymentMethodId } 
    });

    if (!savedCard) {
        return NextResponse.json({ message: "Tarjeta no encontrada" }, { status: 404 });
    }

    // --- CÁLCULO GENERAL (Para Stripe y Registros Globales) ---
    const totalToCharge = Number(amountNet); 
    const impliedSubtotal = totalToCharge / 1.0727; 
    const feeAmount = totalToCharge - impliedSubtotal;
    const amountInCents = Math.round(totalToCharge * 100);

    // 1. COBRAR EN STRIPE
    const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        customer: user.stripeCustomerId,
        payment_method: savedCard.stripePaymentMethodId,
        off_session: true,
        confirm: true,
        description: description || `Servicio GMC: ${serviceType}`,
        metadata: {
            userId: user.id,
            serviceType: serviceType,
            totalAmount: totalToCharge.toFixed(2),
            billIds: billIds ? (Array.isArray(billIds) ? billIds.join(',') : billIds) : null 
        }
    });

    if (paymentIntent.status !== 'succeeded') {
        throw new Error(`El pago falló con estado: ${paymentIntent.status}`);
    }

    // =========================================================================
    // 2. 💾 ACTUALIZACIÓN DE BASE DE DATOS
    // =========================================================================

    if (billDetails && Array.isArray(billDetails) && billDetails.length > 0) {
        
        console.log(`✅ Procesando ${billDetails.length} facturas con montos INDIVIDUALES.`);
        
        // Iteramos factura por factura
        await Promise.all(billDetails.map(async (detail: any) => {
            if (!detail.id || !detail.amount) return;

            // 1. Calcular montos matemáticos
            const rawSubtotal = Number(detail.amount); // $5.00
            const rawTotal = rawSubtotal * 1.0727;     // $5.3635
            const rawFee = rawTotal - rawSubtotal;     // $0.3635

            // 2. Redondear a 2 decimales para la BD (Fix de integridad)
            const cleanSubtotal = Number(rawSubtotal.toFixed(2)); // 5.00
            const cleanTotal = Number(rawTotal.toFixed(2));       // 5.36
            const cleanFee = Number(rawFee.toFixed(2));           // 0.36

            // 3. Actualizar la FACTURA (ConsolidatedShipment)
            await prisma.consolidatedShipment.update({
                where: { id: detail.id },
                data: {
                    status: 'PAGADO', 
                    paymentId: paymentIntent.id,
                    selectedCourier: selectedCourier || undefined, 
                    courierService: courierService || undefined,   
                    
                    subtotalAmount: cleanSubtotal,
                    processingFee: cleanFee,
                    totalAmount: cleanTotal, // Aquí se guardará 5.36
                    
                    updatedAt: new Date()
                }
            });

            // 4. Actualizar los PAQUETES HIJOS
            const childPackagesCount = await prisma.package.count({
                where: { consolidatedShipmentId: detail.id }
            });

            if (childPackagesCount > 0) {
                // Dividimos y volvemos a redondear por si acaso
                const pkgTotal = Number((cleanTotal / childPackagesCount).toFixed(2));
                const pkgSub = Number((cleanSubtotal / childPackagesCount).toFixed(2));
                const pkgFee = Number((cleanFee / childPackagesCount).toFixed(2));

                await prisma.package.updateMany({
                    where: { consolidatedShipmentId: detail.id },
                    data: {
                        status: 'LISTO_PARA_ENVIO',
                        stripePaymentId: paymentIntent.id,
                        
                        // 🔥 Aquí aseguramos que se guarden los valores
                        shippingTotalPaid: pkgTotal,      // 5.36
                        shippingSubtotal: pkgSub,         // 5.00
                        shippingProcessingFee: pkgFee,    // 0.36
                        
                        updatedAt: new Date()
                    }
                });
            }
        }));

    } else {
        // --- FALLBACK (Lógica Antigua) ---
        // Solo entra aquí si el frontend falla en enviar el desglose
        if (packageIds) {
             const idsArray = Array.isArray(packageIds) ? packageIds : packageIds.split(',');
             const count = idsArray.length || 1;
             await prisma.package.updateMany({
                where: { id: { in: idsArray } },
                data: {
                    status: 'LISTO_PARA_ENVIO', 
                    shippingTotalPaid: Number((totalToCharge / count).toFixed(2)),
                    stripePaymentId: paymentIntent.id
                }
             });
        }
        if (billIds) {
             const billsArr = Array.isArray(billIds) ? billIds : billIds.split(',');
             const count = billsArr.length || 1;
             await prisma.consolidatedShipment.updateMany({
                where: { id: { in: billsArr } },
                data: {
                    status: 'PAGADO', 
                    totalAmount: Number((totalToCharge / count).toFixed(2)),
                    paymentId: paymentIntent.id
                }
             });
        }
    }

    // CASO C: Pickup Request
    if (pickupId) {
        await prisma.pickupRequest.update({
            where: { id: pickupId },
            data: {
                status: 'PAGADO',
                subtotal: Number(impliedSubtotal.toFixed(2)),
                processingFee: Number(feeAmount.toFixed(2)),
                totalPaid: Number(totalToCharge.toFixed(2)),
                stripePaymentId: paymentIntent.id,
                updatedAt: new Date()
            }
        });
    }

    return NextResponse.json({ 
        success: true, 
        paymentId: paymentIntent.id
    });

  } catch (error: any) {
    console.error("Payment Error:", error);
    const msg = error.raw?.message || error.message || "Error procesando el pago";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}