import { NextResponse } from "next/server";

// 👇 VACUNA 1: Forzar modo dinámico
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 👇 VACUNA 2: Imports dentro de la función (Lazy Loading)
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;
    // Importamos sendNotification aquí, pero también lo usaremos en la función auxiliar
    
    const session = await auth();

    // 🛡️ CORRECCIÓN DE SEGURIDAD:
    // 1. Usamos (session?.user as any) para leer el rol sin errores de TypeScript.
    // 2. Convertimos a String, Mayúsculas y Trim (Eliminar espacios invisibles).
    const rawRole = (session?.user as any)?.role;
    const userRole = String(rawRole || '').toUpperCase().trim();
    
    // 1. Seguridad (Validamos contra el rol limpio 'userRole')
    if (!session || (userRole !== 'DRIVER' && userRole !== 'ADMIN')) {
        console.error(`🚫 Complete-Delivery: Acceso denegado. Rol detectado: '${userRole}'`);
        return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { packageId, photoUrl, signatureBase64 } = body; 

    if (!packageId || !photoUrl) {
        return NextResponse.json({ message: "Faltan datos (ID o Foto)" }, { status: 400 });
    }

    let resultUser = null; 
    let type = "";

    // -----------------------------------------------------------------------
    // INTENTO 1: ES UN PICKUP (La magia ocurre aquí) 🚚 ✨
    // -----------------------------------------------------------------------
    try {
        // A. Actualizamos el Pickup a ENTREGADO
        const updatedPickup = await prisma.pickupRequest.update({
            where: { id: packageId },
            data: {
                status: 'ENTREGADO',       
                photoDeliveryUrl: photoUrl, 
                signatureUrl: signatureBase64, 
                updatedAt: new Date()
            },
            include: { user: true }
        });
        
        resultUser = updatedPickup.user;
        type = "Delivery Local";

        // B. 🧠 LÓGICA BLINDADA (Dirección + Servicio)
        
        // 1. Chequeo de Dirección (Backup)
        // ✅ CORREGIDO: Usamos 'dropOffAddress' que es el nombre real en tu Schema
        const dest = (updatedPickup.dropOffAddress || "").toLowerCase();
        const isAddressMatch = dest.includes("1861") && (dest.includes("22") || dest.includes("33142") || dest.includes("miami"));

        // 2. Chequeo de Servicio (Principal)
        // Si el cliente pagó 'SHIPPING', es porque quiere envío internacional
        const service = (updatedPickup.serviceType || "").toUpperCase();
        const isServiceMatch = service === 'SHIPPING' || service === 'PICKUP' || service === 'ENVIO_INTERNACIONAL';

        console.log(`🔍 Análisis: Servicio=${service}, Dirección=${dest}`);

        if (isAddressMatch || isServiceMatch) {
            // 🔥 CREAMOS PAQUETE (Si coincide dirección O es servicio de shipping)
            const trackingGenerado = `GMC-PK-${Math.floor(100000 + Math.random() * 900000)}`;
            
            await prisma.package.create({
                data: {
                    userId: resultUser.id,
                    status: 'EN_PROCESAMIENTO', // Nace invisible (Naranja en Admin)
                    description: `Origen: Pickup ${service} #${updatedPickup.id.slice(0,6).toUpperCase()}`,
                    courier: 'Gasp Maker Cargo',
                    gmcTrackingNumber: trackingGenerado,
                    carrierTrackingNumber: `PICKUP-${updatedPickup.id.slice(0,6).toUpperCase()}`,
                    weightLbs: 0, lengthIn: 0, widthIn: 0, heightIn: 0,
                    photoUrlMiami: photoUrl 
                }
            });
            type = "Pickup Recibido en Bodega";
            console.log(`✅ Pickup convertido a Paquete: ${trackingGenerado}`);
        } else {
            // 🛑 SOLO SI ES 'DELIVERY' LOCAL Y NO VA A LA BODEGA
            console.log("🚚 Delivery Local finalizado. No entra en inventario.");
        }

        const pickupRate = await prisma.tenantRate.findFirst({ where: { concept: 'driver_commission_pickup' } })
        const pickupPct = Number(pickupRate?.value ?? 70) / 100
        await transferToDriver(session.user.id, updatedPickup.totalPaid * pickupPct, `Delivery #${packageId.slice(0,6)}`)

        // ✅ Notificamos éxito
        await notifyClient(resultUser.id, type, packageId);
        return NextResponse.json({ success: true, data: updatedPickup });

    } catch (error: any) {
        if (error.code !== 'P2025') {
            console.error("Error en Pickup Update:", error);
            throw error; 
        }
    }

    // -----------------------------------------------------------------------
    // INTENTO 2: ES UNA CONSOLIDACIÓN (Shipment Padre) 📦📦📦
    // -----------------------------------------------------------------------
    try {
        // 1. Actualizamos la Consolidación a ENTREGADO
        const updatedShipment = await prisma.consolidatedShipment.update({
            where: { id: packageId },
            data: {
                status: 'ENTREGADO',
                updatedAt: new Date()
            },
            include: { user: true }
        });
        

        // 2. 🔥 MAGIA: Actualizamos TODOS los paquetes hijos a ENTREGADO 🔥
        // También les pegamos la foto y firma para que quede registro individual
        await prisma.package.updateMany({
            where: { consolidatedShipmentId: packageId },
            data: {
                status: 'ENTREGADO',
                deliveryPhotoUrl: photoUrl,
                deliverySignature: signatureBase64,
                updatedAt: new Date()
            }
        });
        resultUser = updatedShipment.user;
        type = "Consolidación";
    const consRate = await prisma.tenantRate.findFirst({ where: { concept: 'driver_commission_consolidation' } })
const consPct = ((consRate?.value ?? 70) as number) / 100
await transferToDriver(session.user.id, (updatedShipment.totalAmount ?? 0) * consPct, `Consolidation #${packageId.slice(0,6)}`)
        await notifyClient(resultUser.id, type, updatedShipment.gmcShipmentNumber);
        return NextResponse.json({ success: true, data: updatedShipment });

    } catch (error: any) {
        if (error.code !== 'P2025') {
             // Si no es error de "No encontrado", lo lanzamos
             throw error;
        }
        // Si no se encontró, seguimos al siguiente intento (Paquete Individual)
    }

    // -----------------------------------------------------------------------
    // INTENTO 3: PAQUETE INDIVIDUAL (Last Mile) 📦
    // -----------------------------------------------------------------------
    try {
        const updatedPackage = await prisma.package.update({
            where: { id: packageId },
            data: {
                status: 'ENTREGADO',
                deliveryPhotoUrl: photoUrl, 
                deliverySignature: signatureBase64,
                updatedAt: new Date()
            },
            include: { user: true }
        });

           resultUser = updatedPackage.user;
        type = "Paquete";
       const pkgRate = await prisma.tenantRate.findFirst({ where: { concept: 'driver_commission_package_per_lb' } })
const pkgPerLb = Number(pkgRate?.value ?? 2)
await transferToDriver(session.user.id, (updatedPackage.weightLbs ?? 0) * pkgPerLb, `Package #${packageId.slice(0,6)}`)
        await notifyClient(resultUser.id, type, updatedPackage.gmcTrackingNumber);
        return NextResponse.json({ success: true, data: updatedPackage });

    } catch (error: any) {
         if (error.code === 'P2025') {
            return NextResponse.json({ message: "Tarea no encontrada (Ni Pickup, Ni Consolidación, Ni Paquete)." }, { status: 404 });
         }
         throw error;
    }

  } catch (error) {
    console.error("Error crítico:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

// Helper optimizado para importar notificaciones bajo demanda
async function notifyClient(userId: string, type: string, refId: string) {
    if (!userId) return;
    const { sendNotification } = await import("@/lib/notifications");
    
 await sendNotification({
    userId,
    title: JSON.stringify({ key: "deliveryCompletedTitle" }),
    message: JSON.stringify({ key: "deliveryCompletedDesc", type }),
    href: "/dashboard-cliente/historial-solicitudes",
    type: "SUCCESS"
});
}
// Helper para transferir pago al driver via Stripe Connect
async function transferToDriver(driverId: string, amount: number, description: string) {
  try {
    const prisma = (await import("@/lib/prisma")).default
    const driver = await prisma.user.findUnique({
      where: { id: driverId },
      select: { stripeAccountId: true, name: true }
    })

    if (!driver?.stripeAccountId) {
      console.log(`⚠️ Driver ${driverId} has no Stripe account — skipping transfer`)
      return
    }

    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-11-17.clover' })

    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100), // cents
      currency: 'usd',
      destination: driver.stripeAccountId,
      description,
    })

    console.log(`💸 Transfer to ${driver.name}: $${amount} — ${transfer.id}`)
  } catch (err) {
    console.error('Transfer failed (non-critical):', err)
  }
}