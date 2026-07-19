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
        courierService,
        shippingAddress, 
        planName,        
        shopperOrderId,
        walletDiscount, 
        discountApplied,
        packageServiceType,
        idempotencyKey,
        // 🛡️ NUEVOS: Para validación de precio pickup en servidor
        weightLbs,
        distanceMiles: reqDistanceMiles,
        heavyVehicle,
        palletCount,
        isPalletMode
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
    // 🛡️ VALIDACIÓN DE PRECIO PICKUP — Recalculo en servidor ANTES de cobrar
    // Solo aplica a servicios de pickup local (SHIPPING / DELIVERY)
    // PICKUP_WAREHOUSE no necesita validación: el precio viene del inventario en BD
    // =========================================================================
    const PICKUP_SERVICE_TYPES = ['SHIPPING', 'DELIVERY'];
    const isPickupService = PICKUP_SERVICE_TYPES.includes((serviceType || '').toUpperCase());

    if (isPickupService && amountNet) {
        const { calculateAuraLocalDelivery } = await import('@/lib/aura-engine');
        const { getProcessingFee } = await import('@/lib/stripeCalc');

        const wLbs     = Number(weightLbs) || 0;
        const dMiles   = Number(reqDistanceMiles) || 0;
        const vehicle  = (heavyVehicle || 'CARGO_VAN').toUpperCase();
        const pCount   = Number(palletCount) || 1;

        let serverSubtotal = 0;

        if (isPalletMode) {
            // 🔒 Lógica pallet manual — igual que el frontend (no está en Aura Engine)
            if (vehicle === 'BOX_TRUCK') {
                serverSubtotal = 175;
            } else {
                serverSubtotal = pCount === 2 ? 125 : 95;
            }
            // Cargo de distancia (radio base 10 mi)
            if (dMiles > 10) {
                const rate = vehicle === 'BOX_TRUCK' ? 2.50 : 1.75;
                serverSubtotal += parseFloat(((dMiles - 10) * rate).toFixed(2));
            }
        } else if (wLbs > 0) {
            // 🔒 Aura Engine — modo SIMULACIÓN (0-150 lbs)
            const aura = calculateAuraLocalDelivery(
                [{ length: 1, width: 1, height: 1, realWeight: wLbs }],
                dMiles
            );
            serverSubtotal = aura.totalFare;
        }

        if (serverSubtotal > 0) {
            const serverTotal  = parseFloat((serverSubtotal + getProcessingFee(serverSubtotal)).toFixed(2));
            const clientTotal  = parseFloat(Number(amountNet).toFixed(2));

            if (Math.abs(clientTotal - serverTotal) > 0.50) {
                console.warn(
                    `🚨 PRECIO MANIPULADO — usuario: ${session.user.id} | ` +
                    `cliente envió: $${clientTotal} | servidor calculó: $${serverTotal} | ` +
                    `weightLbs: ${wLbs} | distanceMiles: ${dMiles} | vehicle: ${vehicle} | pallets: ${pCount}`
                );
                return NextResponse.json(
                    { message: 'Precio inválido. Recarga la página e intenta de nuevo.' },
                    { status: 400 }
                );
            }

            console.log(`✅ Precio pickup validado — cliente: $${clientTotal} | servidor: $${serverTotal}`);
        }
    }
    // =========================================================================

    // =========================================================================
    // 🔥 1. LÓGICA DE BILLETERA (DESCUENTO DEL SALDO)
    // =========================================================================
    let totalToCharge = Number(amountNet); 
    let appliedWallet = 0;

    const requestedWalletDiscount = walletDiscount ? Number(walletDiscount) : 0;
    
    if (requestedWalletDiscount > 0 && user.walletBalance > 0) {
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
    
    // 🔥 BÓVEDA DB: Verificamos que no esté pagado ya en la base de datos
    if (billIds) {
        const billsArr = Array.isArray(billIds) ? billIds : billIds.split(',');
        const pagados = await prisma.consolidatedShipment.count({
            where: { id: { in: billsArr }, status: 'PAGADO' }
        });
        if (pagados > 0) {
            return NextResponse.json({ message: "¡Esta factura ya fue procesada! Recarga tu página." }, { status: 400 });
        }
    }

    const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: chargeCurrency, 
        customer: user.stripeCustomerId,
        payment_method: savedCard.stripePaymentMethodId,
        off_session: true,
        confirm: true,
        description: description || `Servicio GMC: ${serviceType}`,
        metadata: {
            userId: user.id,
            serviceType: serviceType,
            totalAmountUSD: totalToCharge.toFixed(2), 
            currencyCharged: chargeCurrency,
            walletApplied: appliedWallet.toFixed(2), 
            billIds: billIds ? (Array.isArray(billIds) ? billIds.join(',') : billIds) : null 
        }
    }, {
        // 🔥 EL ESCUDO DE STRIPE: Evita cobros dobles si el cliente hace 5 clics al mismo tiempo
        idempotencyKey: idempotencyKey || undefined
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
    // 4. NOTIFICACIONES & ENLACES INTELIGENTES
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
    const userLang = getLanguage(user.countryCode) || 'en';

    // 1. Alerta al administrador
    await sendAdminPaymentAlert(
        user.name || 'Cliente Desconocido',
        totalToCharge,
        serviceType || 'Pago General',
        paymentIntent.id
    );

    // =========================================================================
    // 🔥 2. GENERACIÓN DEL ENLACE INTELIGENTE
    // =========================================================================
    let targetId = '';
    if (packageIds) targetId = Array.isArray(packageIds) ? packageIds[0] : packageIds.split(',')[0];
    else if (billIds) targetId = Array.isArray(billIds) ? billIds[0] : billIds.split(',')[0];
    else if (shopperOrderId) targetId = shopperOrderId;
    else if (pickupId) targetId = pickupId;
    
    const searchParam = targetId || '';

    let targetTab = 'LOCAL';
    const evalType = (packageServiceType || serviceType || '').toUpperCase();
    
    if (evalType === 'CONSOLIDATION' || evalType === 'SHIPPING_INTL' || evalType === 'DOCUMENT') targetTab = 'INTERNATIONAL';
    else if (evalType === 'MAILBOXSUBSCRIPTION' || planName || evalType === 'PERSONAL_SHOPPER' || evalType === 'STORE_PICKUP') targetTab = 'SERVICES';
    else if (evalType === 'STORAGE_FEE' || evalType === 'PICKUP') targetTab = 'PAYMENTS';
    else if (evalType === 'DELIVERY' || evalType === 'SHIPPING') targetTab = 'LOCAL';

    const exactHref = `/${userLang}/dashboard-cliente/historial-solicitudes?tab=${targetTab}&search=${searchParam}`;

    // =========================================================================
    // 🌍 3. ENVÍO DE NOTIFICACIÓN EN FORMATO JSON (MULTILINGÜE DINÁMICO)
    // =========================================================================
    await sendNotification({
        userId: user.id,
        title: JSON.stringify({ key: "paymentSuccessTitle" }),
        message: JSON.stringify({ key: "paymentSuccessDesc", amount: totalToCharge.toFixed(2) }),
        type: "SUCCESS",
        href: exactHref
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
            const currentTargetId = detail.id || detail.shipmentId || detail.billId;

            if (!currentTargetId) return;

            const currentShipment = await prisma.consolidatedShipment.findUnique({
                where: { id: currentTargetId },
                include: { _count: { select: { packages: true } } }
            });

            if (!currentShipment) return;

            const isActuallyDoc = currentShipment._count.packages === 1 && (currentShipment.weightLbs || 0) <= 0.5;
            
            const nextStatus = (currentShipment.serviceType === 'STORAGE_FEE' || currentShipment.serviceType === 'PICKUP') 
                ? 'LISTO_PARA_RETIRO' 
                : 'LISTO_PARA_ENVIO';

            await prisma.consolidatedShipment.update({
                where: { id: currentTargetId },
                data: {
                    status: 'PAGADO', 
                    paymentId: paymentIntent.id,
                    selectedCourier: selectedCourier || undefined, 
                    courierService: courierService || undefined,   
                    shippingAddress: shippingAddress || undefined, 
                    serviceType: isActuallyDoc ? "DOCUMENT" : (packageServiceType || currentShipment.serviceType),
                    subtotalAmount: cleanSubtotal,
                    processingFee: cleanFee,
                    totalAmount: cleanTotal,
                    updatedAt: new Date()
                }
            });

            const childPackagesCount = await prisma.package.count({
                where: { consolidatedShipmentId: currentTargetId }
            });
            
            if (childPackagesCount > 0) {
                const pkgTotal = Number((cleanTotal / childPackagesCount).toFixed(2));
                const pkgSub = Number((cleanSubtotal / childPackagesCount).toFixed(2));
                const pkgFee = Number((cleanFee / childPackagesCount).toFixed(2));

                await prisma.package.updateMany({
                    where: { consolidatedShipmentId: currentTargetId },
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
        // --- Bloque de Paquetes Individuales ---
        if (packageIds) {
            const idsArray = Array.isArray(packageIds) ? packageIds : packageIds.split(',');
            
            for (const pkgId of idsArray) {
                const pkg = await prisma.package.findUnique({ where: { id: pkgId } });
                const isDoc = (pkg?.weightLbs || 0) <= 0.5 && !pkg?.consolidatedShipmentId;
                
                await prisma.package.update({
                    where: { id: pkgId },
                    data: {
                        status: (serviceType === 'Warehousing' || serviceType === 'Pickup') ? 'LISTO_PARA_RETIRO' : 'LISTO_PARA_ENVIO',
                        stripePaymentId: paymentIntent.id,
                        shippingAddress: shippingAddress || undefined,
                        shippingTotalPaid: Number((totalToCharge / idsArray.length).toFixed(2)),
                        serviceType: isDoc ? 'DOCUMENT' : undefined,
                        description: isDoc ? 'Envío de Documento' : pkg?.description
                    }
                });
            }
        }

        // --- Bloque de Facturas/Consolidaciones (SHIPs) ---
        if (billIds) {
            const billsArr = Array.isArray(billIds) ? billIds : billIds.split(',');
            
            for (const bId of billsArr) {
                const pkgCount = await prisma.package.count({ where: { consolidatedShipmentId: bId } });
                const shipment = await prisma.consolidatedShipment.findUnique({ where: { id: bId } });
                const isDoc = pkgCount === 1 && (shipment?.weightLbs || 0) <= 0.5;

                await prisma.consolidatedShipment.update({
                    where: { id: bId },
                    data: {
                        status: 'PAGADO', 
                        paymentId: paymentIntent.id,
                        shippingAddress: shippingAddress || undefined,
                        totalAmount: Number((totalToCharge / billsArr.length).toFixed(2)),
                        serviceType: isDoc ? "DOCUMENT" : (packageServiceType || undefined)
                    }
                });
            }
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