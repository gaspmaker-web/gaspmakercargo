import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { sendPaymentReceiptEmail } from "@/lib/notifications";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { billIds, paymentId, selectedCourier, courierService } = body;

    console.log("🔎 UPDATE-BILLS RECIBIÓ:", { billIds, paymentId });

    if (!billIds || !Array.isArray(billIds) || billIds.length === 0) {
        return NextResponse.json({ message: "Faltan los IDs de las facturas" }, { status: 400 });
    }

    // 🔄 BUCLE PRINCIPAL
    for (const id of billIds) {
        
        // ---------------------------------------------------------
        // CASO 1: ¿ES UNA CONSOLIDACIÓN? (Factura Agrupada)
        // ---------------------------------------------------------
        const shipment = await prisma.consolidatedShipment.findUnique({
            where: { id: id },
            include: { packages: true, user: true }
        });

        if (shipment) {
            const totalAmount = shipment.totalAmount || 0;
            console.log(`📦 Procesando Consolidación: ${id}. Monto Total: $${totalAmount}`);

            // A. Actualizar la Consolidación Padre
            await prisma.consolidatedShipment.update({
                where: { id: id },
                data: {
                    status: 'LISTO_PARA_ENVIO',
                    paymentId: paymentId, // ✅ Nombre correcto según tu BD
                    updatedAt: new Date()
                }
            });

            // B. Actualizar los Paquetes Hijos
            const packageCount = shipment.packages.length || 1;
            const amountPerPackage = totalAmount / packageCount;

            await prisma.package.updateMany({
                where: { consolidatedShipmentId: id },
                data: {
                    status: 'LISTO_PARA_ENVIO',
                    shippingTotalPaid: amountPerPackage, // 💰 Guardamos el precio
                    stripePaymentId: paymentId,
                    ...(selectedCourier && { selectedCourier: selectedCourier }),
                    updatedAt: new Date()
                }
            });

            // C. Enviar Correo
            await enviarCorreoRecibo(shipment, totalAmount, selectedCourier);
            continue; 
        }

        // ---------------------------------------------------------
        // CASO 2: ¿ES UN PAQUETE INDIVIDUAL? (Pago Directo)
        // ---------------------------------------------------------
        const pkg = await prisma.package.findUnique({
            where: { id: id },
            include: { user: true }
        });

        if (pkg) {
            console.log(`📦 Procesando Paquete Individual: ${id}`);
            
            // Recuperamos el precio si se perdió
            let finalPrice = pkg.shippingTotalPaid || 0;
            if (finalPrice === 0 && pkg.shippingSubtotal) {
                finalPrice = (pkg.shippingSubtotal || 0) + (pkg.shippingProcessingFee || 0);
            }

            await prisma.package.update({
                where: { id: id },
                data: {
                    status: 'LISTO_PARA_ENVIO',
                    stripePaymentId: paymentId, // En 'Package' sí se llama stripePaymentId
                    shippingTotalPaid: finalPrice > 0 ? finalPrice : undefined, 
                    selectedCourier: selectedCourier || pkg.selectedCourier,
                    updatedAt: new Date()
                }
            });

            await enviarCorreoRecibo({
                user: pkg.user,
                gmcShipmentNumber: pkg.gmcTrackingNumber,
            }, finalPrice, pkg.selectedCourier || selectedCourier);
            
            continue;
        }
    }

    return NextResponse.json({ success: true, message: "Pagos registrados correctamente" });

  } catch (error: any) {
    console.error("🔥 ERROR EN UPDATE-BILLS:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

async function enviarCorreoRecibo(entity: any, amount: number, courierName?: string) {
    try {
        if (!entity.user || !entity.user.email) return;
        await sendPaymentReceiptEmail(
            entity.user.email,
            entity.user.name || 'Cliente',
            courierName || entity.selectedCourier || 'Envío Internacional',
            amount,
            entity.gmcShipmentNumber || entity.gmcTrackingNumber || 'REF-PAGO',
            "Pago confirmado. Tu envío está en cola de despacho."
        );
    } catch (e) {
        console.warn("⚠️ Error enviando correo:", e);
    }
}