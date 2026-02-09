import { NextResponse } from "next/server";

// 👇 VACUNA 1: Forzar modo dinámico (Vital para transacciones financieras)
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 👇 VACUNA 2: Imports dentro de la función (Lazy Loading)
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;
    const { stripe } = await import("@/lib/stripe");
    
    // 🔥 IMPORTAMOS LA LIBRERÍA DE NOTIFICACIONES
    const { sendPaymentReceiptEmail, sendAdminPaymentAlert, sendNotification, getT } = await import("@/lib/notifications");

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
        billDetails, 
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

    // --- CÁLCULO GENERAL ---
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
    // 🔔 NOTIFICACIONES
    // =========================================================================
    const userLang = (user as any).language || 'en';
    const t = getT(userLang);

    // A. Email al Cliente
    await sendPaymentReceiptEmail(
        user.email!,
        user.name || 'Cliente',
        serviceType || 'Servicio Logístico',
        totalToCharge,
        paymentIntent.id,
        description || 'Pago procesado correctamente',
        userLang
    );

    // B. Alerta al Admin
    await sendAdminPaymentAlert(
        user.name || 'Cliente Desconocido',
        totalToCharge,
        serviceType || 'Pago General',
        paymentIntent.id
    );

    // C. Notificación en Dashboard
    await sendNotification({
        userId: user.id,
        title: t.paymentTitle,
        message: `${t.paymentBody} $${totalToCharge.toFixed(2)}`,
        type: "SUCCESS"
    });

    // =========================================================================
    // 2. 💾 ACTUALIZACIÓN DE BASE DE DATOS (CORREGIDA)
    // =========================================================================

    if (billDetails && Array.isArray(billDetails) && billDetails.length > 0) {
        
        console.log(`✅ Procesando ${billDetails.length} facturas con montos INDIVIDUALES.`);
        
        // Iteramos factura por factura
        await Promise.all(billDetails.map(async (detail: any) => {
            if (!detail.id || !detail.amount) return;

            // 1. Averiguar qué tipo de envío es (Pickup o Ship)
            const currentShipment = await prisma.consolidatedShipment.findUnique({
                where: { id: detail.id },
                select: { serviceType: true }
            });

            // 🚨 CORRECCIÓN VITAL: Definir el estado correcto
            // Si es 'STORAGE_FEE', es un Pickup -> 'PENDIENTE_RETIRO' (o LISTO_PARA_RETIRO)
            // Si es cualquier otra cosa -> 'LISTO_PARA_ENVIO'
            const isPickup = currentShipment?.serviceType === 'STORAGE_FEE';
            const nextStatus = isPickup ? 'LISTO_PARA_RETIRO' : 'LISTO_PARA_ENVIO';

            // 2. Calcular montos
            const rawSubtotal = Number(detail.amount); 
            const rawTotal = rawSubtotal * 1.0727;     
            const rawFee = rawTotal - rawSubtotal;     

            const cleanSubtotal = Number(rawSubtotal.toFixed(2));
            const cleanTotal = Number(rawTotal.toFixed(2));
            const cleanFee = Number(rawFee.toFixed(2));

            // 3. Actualizar la FACTURA
            await prisma.consolidatedShipment.update({
                where: { id: detail.id },
                data: {
                    status: 'PAGADO', 
                    paymentId: paymentIntent.id,
                    selectedCourier: selectedCourier || undefined, 
                    courierService: courierService || undefined,   
                    
                    subtotalAmount: cleanSubtotal,
                    processingFee: cleanFee,
                    totalAmount: cleanTotal,
                    
                    updatedAt: new Date()
                }
            });

            // 4. Actualizar los PAQUETES HIJOS con el estado correcto
            const childPackagesCount = await prisma.package.count({
                where: { consolidatedShipmentId: detail.id }
            });

            if (childPackagesCount > 0) {
                const pkgTotal = Number((cleanTotal / childPackagesCount).toFixed(2));
                const pkgSub = Number((cleanSubtotal / childPackagesCount).toFixed(2));
                const pkgFee = Number((cleanFee / childPackagesCount).toFixed(2));

                await prisma.package.updateMany({
                    where: { consolidatedShipmentId: detail.id },
                    data: {
                        status: nextStatus, // 👈 USAMOS EL ESTADO CORRECTO (NO SIEMPRE ES ENVÍO)
                        stripePaymentId: paymentIntent.id,
                        
                        shippingTotalPaid: pkgTotal,
                        shippingSubtotal: pkgSub,
                        shippingProcessingFee: pkgFee,
                        
                        updatedAt: new Date()
                    }
                });
            }
        }));

    } else {
        // --- FALLBACK (Lógica Antigua - También protegida) ---
        if (packageIds) {
             const idsArray = Array.isArray(packageIds) ? packageIds : packageIds.split(',');
             const count = idsArray.length || 1;
             
             // Por defecto asumimos envio, a menos que el serviceType diga lo contrario
             const fallbackStatus = (serviceType === 'Warehousing' || serviceType === 'Pickup') 
                ? 'PENDIENTE_RETIRO' 
                : 'LISTO_PARA_ENVIO';

             await prisma.package.updateMany({
                where: { id: { in: idsArray } },
                data: {
                    status: fallbackStatus, 
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

    // CASO C: Pickup Request (Si existe un objeto PickupRequest separado)
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
        paymentId: paymentIntent.id,
        financials: {
            total: Number(totalToCharge.toFixed(2)),
            subtotal: Number(impliedSubtotal.toFixed(2)),
            fee: Number(feeAmount.toFixed(2))
        }
    });

  } catch (error: any) {
    console.error("Payment Error:", error);
    const msg = error.raw?.message || error.message || "Error procesando el pago";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}