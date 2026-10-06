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
        await notifyB2BStore(packageId, photoUrl, signatureBase64 || '');
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
    const prisma = (await import("@/lib/prisma")).default;
    const driver = await prisma.user.findUnique({
      where: { id: driverId },
      select: { stripeAccountId: true, name: true }
    });

    if (!driver?.stripeAccountId) {
      console.log(`⚠️ Driver ${driverId} has no Stripe account — skipping transfer`);
      return;
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-11-17.clover' });

    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      destination: driver.stripeAccountId,
      description,
    });

    console.log(`💸 Transfer to ${driver.name}: $${amount} — ${transfer.id}`);
  } catch (err) {
    console.error('Transfer failed (non-critical):', err);
  }
}

// Helper: Email POD a tienda B2B
async function notifyB2BStore(pickupId: string, photoUrl: string, signatureBase64: string) {
  try {
    const prisma = (await import("@/lib/prisma")).default;
    const pickup = await prisma.pickupRequest.findUnique({
      where: { id: pickupId },
      include: { user: { include: { b2bAccount: true } } }
    });

    if (!pickup?.user?.b2bAccount || pickup.user.role !== 'B2B_STORE') return;

    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const deliveredAt = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });

    await resend.emails.send({
      from: 'Gasp Maker Cargo <noreply@gaspmakercargo.com>',
      to: pickup.user.email!,
      subject: `✅ Delivery Completed — ${pickup.dropOffAddress}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #222b3c; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #c9a84c; margin: 0; font-size: 20px;">Delivery Confirmed</h1>
            <p style="color: #9ca3af; margin: 4px 0 0; font-size: 13px;">Gasp Maker Cargo — B2B Delivery</p>
          </div>
          <div style="background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #374151; font-size: 15px;">Hi <strong>${pickup.user.b2bAccount.businessName}</strong>,</p>
            <p style="color: #374151;">Your delivery has been successfully completed.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 8px 0; color: #6b7280;">Delivered to</td>
                <td style="padding: 8px 0; font-weight: bold; color: #111827;">${pickup.dropOffAddress}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 8px 0; color: #6b7280;">Delivered at</td>
                <td style="padding: 8px 0; font-weight: bold; color: #111827;">${deliveredAt} ET</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Order ID</td>
                <td style="padding: 8px 0; font-weight: bold; color: #111827;">#${pickupId.slice(0,8).toUpperCase()}</td>
              </tr>
            </table>
            <p style="color: #374151; font-size: 13px; font-weight: bold; margin-bottom: 8px;">Proof of Delivery (POD):</p>
            <img src="${photoUrl}" alt="Delivery Photo" style="width: 100%; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 12px;" />
            ${signatureBase64 ? `
            <p style="color: #374151; font-size: 13px; font-weight: bold; margin-bottom: 8px;">Customer Signature:</p>
            <img src="${signatureBase64}" alt="Signature" style="max-width: 200px; border: 1px solid #e5e7eb; border-radius: 8px;" />
            ` : ''}
            <div style="margin-top: 24px; padding: 12px; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
              <p style="color: #15803d; font-size: 13px; margin: 0;">✅ This delivery has been recorded and charged to your account.</p>
            </div>
          </div>
        </div>
      `
    });

    console.log(`📧 POD email sent to B2B store: ${pickup.user.email}`);
  } catch (err) {
    console.error('B2B POD email failed (non-critical):', err);
  }
}