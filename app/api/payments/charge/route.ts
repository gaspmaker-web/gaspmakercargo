import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache"; // 🔥 EL LIMPIADOR DE PANTALLA

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
        courierService,
        shippingAddress, 
        planName,        
        shopperOrderId,
        walletDiscount, 
        discountApplied

    } = await req.json();

    if (!amountNet || !paymentMethodId) {
        return NextResponse.json({ message: "Faltan datos de pago" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ 
        where: { id: session.user.id },
        select: { id: true, name: true, stripeCustomerId: true, walletBalance: true, referredBy: true, referralRewardPaid: true, email: true, countryCode: true }
    });

    if (!user || !user.stripeCustomerId) {
        return NextResponse.json({ message: "Usuario no configurado para pagos" }, { status: 400 });
    }

    const savedCard = await prisma.paymentMethod.findUnique({ 
        where: { id: paymentMethodId } 
    });

    if (!savedCard) {
        return NextResponse.json({ message: "Tarjeta no encontrada" }, { status: 404 });
    }

    // =========================================================================
    // 🔥 1. LÓGICA DE BILLETERA (DESCUENTO DEL SALDO)
    // =========================================================================
    let totalToCharge = Number(amountNet); 
    let appliedWallet = 0;

    const requestedWalletDiscount = walletDiscount ? Number(walletDiscount) : 0;
    
    if (requestedWalletDiscount > 0 && user.walletBalance > 0) {
        // Stripe exige un cargo mínimo de $0.50 centavos
        appliedWallet = Math.min(requestedWalletDiscount, user.walletBalance, totalToCharge - 0.50);
        if (appliedWallet < 0) appliedWallet = 0;
        
        totalToCharge = totalToCharge - appliedWallet;
        console.log(`💰 Aplicando descuento de billetera: -$${appliedWallet.toFixed(2)}`);
    }

    const STRIPE_PERCENTAGE = 0.044; 
    const STRIPE_FIXED_FEE = 0.30;
    
    const impliedSubtotal = (totalToCharge * (1 - STRIPE_PERCENTAGE)) - STRIPE_FIXED_FEE;
    const feeAmount = totalToCharge - impliedSubtotal;
    let amountInCents = Math.round(totalToCharge * 100);
    let chargeCurrency = 'usd';

   // =========================================================================
    // 🔥 NUEVO: BYPASS DE DIVISAS PARA TRINIDAD Y TOBAGO (NIVEL ENTERPRISE)
    // =========================================================================
    const GMC_TTD_EXCHANGE_RATE = 7.30; 
    
    // 🕵️‍♂️ EL SECRETO: Leemos el país DIRECTAMENTE desde Stripe usando el ID guardado
    const stripePaymentMethod = await stripe.paymentMethods.retrieve(savedCard.stripePaymentMethodId);
    const isCardFromTrinidad = stripePaymentMethod.card?.country?.toUpperCase() === 'TT';

    if (isCardFromTrinidad) {
        console.log(`🇹🇹 Tarjeta de Trinidad detectada (BIN: ${stripePaymentMethod.card?.country}). Aplicando moneda local para evitar bloqueo.`);
        
        const totalInTTD = totalToCharge * GMC_TTD_EXCHANGE_RATE;
        amountInCents = Math.round(totalInTTD * 100); 
        chargeCurrency = 'ttd';
        console.log(`✅ Bypass Activado: Cobrando ${totalInTTD.toFixed(2)} TTD en lugar de ${totalToCharge.toFixed(2)} USD.`);
    } else {
        console.log(`🇺🇸 Tarjeta de ${stripePaymentMethod.card?.country || 'USA'} detectada. Cobrando en USD normal.`);
    }

    // =========================================================================
    // 2. COBRAR EN STRIPE
    // =========================================================================
    const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: chargeCurrency, // 🔥 Aquí usamos la moneda dinámica (usd o ttd)
        customer: user.stripeCustomerId,
        payment_method: savedCard.stripePaymentMethodId,
        off_session: true,
        confirm: true,
        description: description || `Servicio GMC: ${serviceType}`,
        metadata: {
            userId: user.id,
            serviceType: serviceType,
            totalAmountUSD: totalToCharge.toFixed(2), // Guardamos el equivalente en USD para tu contabilidad
            currencyCharged: chargeCurrency,
            walletApplied: appliedWallet.toFixed(2), 
            billIds: billIds ? (Array.isArray(billIds) ? billIds.join(',') : billIds) : null 
        }
    });

    if (paymentIntent.status !== 'succeeded') {
        throw new Error(`El pago falló con estado: ${paymentIntent.status}`);
    }

    // =========================================================================
    // 🔥 3. RESTAR SALDO Y PREMIAR REFERIDOS (EL CAJERO VIRTUAL ENTERPRISE)
    // =========================================================================
    
    if (appliedWallet > 0) {
        await prisma.user.update({
            where: { id: user.id },
            data: { walletBalance: { decrement: appliedWallet } }
        });
    }
    
    const numAmountNet = Number(amountNet);
    const numDiscount = Number(discountApplied || 0);
    const originalInvoiceAmount = numAmountNet + numDiscount;

    console.log(`\n--- 🕵️‍♂️ AUDITORÍA DE REFERIDOS ---`);
    console.log(`- Invitado ID: ${user.id}`);
    console.log(`- Promotor Código: ${user.referredBy}`);
    console.log(`- AmountNet recibido: $${numAmountNet}`);
    console.log(`- Descuento recibido: $${numDiscount}`);
    console.log(`- Monto Original Calculado: $${originalInvoiceAmount}`);
    console.log(`- Estado del Candado Inicial: ${user.referralRewardPaid}`);

    if (originalInvoiceAmount >= 100 && user.referredBy && user.referralRewardPaid === false) {
        console.log(`- ✅ Condición Inicial Cumplida. Intentando cerrar candado...`);
        
        try {
            const lock = await prisma.user.updateMany({
                where: {
                    id: user.id,
                    referralRewardPaid: false
                },
                data: {
                    referralRewardPaid: true
                }
            });

            console.log(`- 🔒 Resultado del Candado Atómico: lock.count = ${lock.count}`);

            if (lock.count > 0) { 
                const promotor = await prisma.user.findUnique({
                    where: { referralCode: user.referredBy }
                });

                if (promotor) {
                    console.log(`- 🎁 Repartiendo premio. Sumando $25 al Promotor ID: ${promotor.id}`);
                    
                    await prisma.user.update({
                        where: { id: promotor.id },
                        data: { walletBalance: { increment: 25.00 } }
                    });

                    await sendNotification({
                        userId: promotor.id,
                        title: "¡Ganaste $25.00 USD! 🎁",
                        message: `Tu referido ${user.name} acaba de completar su envío. ¡Te hemos abonado $25 a tu billetera!`,
                        type: "SUCCESS"
                    });
                } else {
                    console.log(`- ❌ ERROR: No se encontró al promotor con código ${user.referredBy}`);
                }
            } else {
                console.log(`- ⚠️ Candado rechazado. Otra petición ya lo cerró (Posible Doble Clic).`);
            }
        } catch (dbError) {
             console.log(`- ❌ ERROR en la Base de Datos durante la actualización de referidos:`, dbError);
        }
    } else {
        console.log(`- ❌ Condición NO cumplida. No se ejecuta la regla de referidos.`);
    }
    console.log(`----------------------------------\n`);

    // =========================================================================
    // 4. NOTIFICACIONES (Soporte Multilingüe Completo: ES, EN, FR, PT)
    // =========================================================================
    const getLanguage = (code: string | null) => {
        if (!code) return 'en'; 
        const upperCode = code.toUpperCase();
        
        const spanishCountries = ['ES', 'MX', 'CO', 'AR', 'PE', 'VE', 'CL', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY', 'PR', 'GQ'];
        if (spanishCountries.includes(upperCode)) return 'es';
        
        const frenchCountries = ['FR', 'HT', 'CD', 'CG', 'ML', 'SN', 'CI', 'CM', 'BE', 'CH', 'MG', 'GN', 'BF', 'BI', 'BJ', 'TG', 'CF', 'GA', 'DJ', 'RW', 'VU', 'SC', 'KM', 'MC'];
        if (frenchCountries.includes(upperCode)) return 'fr';
        
        const portugueseCountries = ['BR', 'PT', 'AO', 'MZ', 'GW', 'CV', 'ST', 'TL'];
        if (portugueseCountries.includes(upperCode)) return 'pt';
        
        return 'en'; 
    };

    const userLang = getLanguage(user.countryCode);
    const t = getT(userLang);

    await sendAdminPaymentAlert(
        user.name || 'Cliente Desconocido',
        totalToCharge,
        serviceType || 'Pago General',
        paymentIntent.id
    );

    // Ajustamos el mensaje para que el cliente sepa que pagó en su moneda
    let successMessage = `${t.paymentBody} $${totalToCharge.toFixed(2)} USD.`;
    if (chargeCurrency === 'ttd') {
        successMessage = `Payment successful! Your bank was charged in TTD to avoid limits. (Equivalent: $${totalToCharge.toFixed(2)} USD).`;
    }
    if (appliedWallet > 0) {
        successMessage += ` Ahorraste $${appliedWallet.toFixed(2)} USD usando tu billetera.`;
    }

    await sendNotification({
        userId: user.id,
        title: chargeCurrency === 'ttd' ? "Payment Successful (TTD) ✅" : t.paymentTitle,
        message: successMessage,
        type: "SUCCESS"
    });

// =========================================================================
    // 5. 💾 ACTUALIZACIÓN DE BASE DE DATOS (Versión Limpia)
    // =========================================================================

    if (billDetails && Array.isArray(billDetails) && billDetails.length > 0) {
        
        const count = billDetails.length;
        const cleanTotal = Number((totalToCharge / count).toFixed(2));
        const cleanSubtotal = Number((impliedSubtotal / count).toFixed(2));
        const cleanFee = Number((feeAmount / count).toFixed(2));

        await Promise.all(billDetails.map(async (detail: any) => {
            const targetId = detail.id || detail.shipmentId || detail.billId;

            if (!targetId) return;

            const currentShipment = await prisma.consolidatedShipment.findUnique({
                where: { id: targetId },
                select: { serviceType: true }
            });

            if (!currentShipment) return;

            const isPickup = currentShipment.serviceType === 'STORAGE_FEE' || currentShipment.serviceType === 'PICKUP';
            const nextStatus = isPickup ? 'LISTO_PARA_RETIRO' : 'LISTO_PARA_ENVIO';

            await prisma.consolidatedShipment.update({
                where: { id: targetId },
                data: {
                    status: 'PAGADO', 
                    paymentId: paymentIntent.id,
                    selectedCourier: selectedCourier || undefined, 
                    courierService: courierService || undefined,   
                    shippingAddress: shippingAddress || undefined, 
                    subtotalAmount: cleanSubtotal,
                    processingFee: cleanFee,
                    totalAmount: cleanTotal,
                    updatedAt: new Date()
                }
            });

            const childPackagesCount = await prisma.package.count({
                where: { consolidatedShipmentId: targetId }
            });

            if (childPackagesCount > 0) {
                const pkgTotal = Number((cleanTotal / childPackagesCount).toFixed(2));
                const pkgSub = Number((cleanSubtotal / childPackagesCount).toFixed(2));
                const pkgFee = Number((cleanFee / childPackagesCount).toFixed(2));

                await prisma.package.updateMany({
                    where: { consolidatedShipmentId: targetId },
                    data: {
                        status: nextStatus, 
                        stripePaymentId: paymentIntent.id,
                        shippingAddress: shippingAddress || undefined, 
                        shippingTotalPaid: pkgTotal,
                        shippingSubtotal: pkgSub,
                        shippingProcessingFee: pkgFee,
                        updatedAt: new Date()
                    }
                });
            }
        }));

    } else {
        if (packageIds) {
             const idsArray = Array.isArray(packageIds) ? packageIds : packageIds.split(',');
             const count = idsArray.length || 1;
             const fallbackStatus = (serviceType === 'Warehousing' || serviceType === 'Pickup' || serviceType === 'PICKUP') 
                ? 'LISTO_PARA_RETIRO' 
                : 'LISTO_PARA_ENVIO';

             await prisma.package.updateMany({
                where: { id: { in: idsArray } },
                data: {
                    status: fallbackStatus, 
                    shippingTotalPaid: Number((totalToCharge / count).toFixed(2)),
                    stripePaymentId: paymentIntent.id,
                    shippingAddress: shippingAddress || undefined 
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
                    paymentId: paymentIntent.id,
                    shippingAddress: shippingAddress || undefined 
                }
             });
        }
    }

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

    if (shopperOrderId) {
        await prisma.shopperOrder.update({
            where: { id: shopperOrderId },
            data: {
                status: 'PAID', 
                stripePaymentId: paymentIntent.id, 
                updatedAt: new Date()
            }
        });
    }

    // =========================================================================
    // 🔥 EL LIMPIADOR DE PANTALLA (Este sí lo dejamos, es vital)
    // =========================================================================
    try {
        const { revalidatePath } = await import("next/cache");
        revalidatePath('/', 'layout');
    } catch (e) {
        console.error("Error limpiando caché:", e);
    }

   // =========================================================================
    // 🔥 6. GUARDAR SUSCRIPCIÓN DE BUZÓN (SI APLICA)
    // =========================================================================
    if (serviceType === 'MailboxSubscription' || planName || description?.includes('Buzón')) {
        console.log("📥 Procesando guardado de Buzón Virtual en Base de Datos...");
        
        const originalAmount = Number(amountNet);
        const exactDbPlanName = originalAmount < 10 ? "Digital Basic" : "Premium Cargo";

        const currentPeriodEnd = new Date();
        currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

        try {
            const existingSub = await prisma.mailboxSubscription.findFirst({
                where: { userId: session.user.id }
            });

            if (existingSub) {
                await prisma.mailboxSubscription.update({
                    where: { id: existingSub.id },
                    data: {
                        planType: exactDbPlanName,
                        stripeSubscriptionId: paymentIntent.id, 
                        currentPeriodEnd: currentPeriodEnd,
                        status: "PENDING_USPS" 
                    }
                });
            } else {
                await prisma.mailboxSubscription.create({
                    data: {
                        userId: session.user.id,
                        planType: exactDbPlanName,
                        stripeSubscriptionId: paymentIntent.id,
                        currentPeriodEnd: currentPeriodEnd,
                        status: "PENDING_USPS" 
                    }
                });
            }

            await prisma.mailboxTransaction.create({
                data: {
                    userId: session.user.id,
                    amount: originalAmount,
                    description: exactDbPlanName === "Digital Basic" ? "SUSCRIPCIÓN BUZÓN BÁSICO" : "SUSCRIPCIÓN BUZÓN PREMIUM",
                    stripePaymentId: paymentIntent.id,
                    status: "COMPLETADO" 
                }
            });
            console.log(`✅ Suscripción de Buzón (${exactDbPlanName}) guardada correctamente.`);
        } catch (dbError) {
            console.error("❌ Error guardando Buzón en BD:", dbError);
        }
    }

 // =========================================================================
    // 🔥 EL LIMPIADOR: Obliga a la pantalla del cliente a refrescarse al instante
    // =========================================================================
    try {
        const { revalidatePath } = await import("next/cache");
        console.log("🧹 Limpiando la memoria caché de la pantalla...");
        revalidatePath('/', 'layout');
    } catch (e) {
        console.error("Error limpiando caché:", e);
    }

    return NextResponse.json({ 
        success: true, 
        paymentId: paymentIntent.id,
        financials: {
            total: Number(totalToCharge.toFixed(2)),
            subtotal: Number(impliedSubtotal.toFixed(2)),
            fee: Number(feeAmount.toFixed(2)),
            walletUsed: Number(appliedWallet.toFixed(2)),
            currencyCharged: chargeCurrency
        }
    });

  } catch (error: any) {
    console.error("Payment Error:", error);
    const msg = error.raw?.message || error.message || "Error procesando el pago";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}