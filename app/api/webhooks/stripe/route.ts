import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// 👇 VACUNA 1: Forzar modo dinámico (Vital para Webhooks)
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 👇 VACUNA 2: Imports e Inicialización dentro de la función (Lazy Loading)
    const prisma = (await import('@/lib/prisma')).default;

    // 🚨 Inicializamos Stripe AQUÍ dentro, no afuera.
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16' as any, // Verifica que coincida con tu versión en package.json
    });

   const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
  console.error("⚠️ CRÍTICO: Falta la variable de entorno STRIPE_WEBHOOK_SECRET en Vercel");
  return new NextResponse("Webhook secret missing", { status: 500 });
}

    const body = await req.text();
    const signature = headers().get('Stripe-Signature') as string;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error: any) {
      console.error(`⚠️  Error de firma en Webhook: ${error.message}`);
      return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    // Solo procesamos si el pago se completó
    if (event.type === 'checkout.session.completed') {
      
      // 1. Extraer Metadata (Incluyendo packageIds para Storage)
      const { 
          userId, 
          packageId, 
          shipmentId, 
          type, 
          description, 
          packageIds 
      } = session.metadata || {};

      const amount = session.amount_total ? session.amount_total / 100 : 0;
      const stripePaymentId = session.payment_intent as string;

      try {
        console.log(`💰 Procesando pago tipo: ${type} | Usuario: ${userId}`);

        // ==================================================================
        // ESCENARIO A: PAGO DE CONSOLIDACIÓN
        // ==================================================================
        if (type === 'CONSOLIDATION_PAYMENT' && shipmentId) {
          await prisma.consolidatedShipment.update({
            where: { id: shipmentId },
            data: {
              status: 'PAGADO',        
              // paymentStatus: 'PAID', // ⚠️ Comentado: No existe en tu Schema actual
              updatedAt: new Date(),
            },
          });
          console.log(`✅ Consolidación ${shipmentId} actualizada a PAGADO.`);
        } 
        
        // ==================================================================
        // ESCENARIO B: PAGO DE PAQUETE INDIVIDUAL
        // ==================================================================
        else if (type === 'SINGLE_PACKAGE_PAYMENT' && packageId) {
          await prisma.package.update({
            where: { id: packageId },
            data: {
              status: 'LISTO_PARA_ENVIAR', 
              // paymentStatus: 'PAID', // ⚠️ Comentado: No existe en tu Schema actual
              // isPaid: true,          // ⚠️ Comentado: No existe en tu Schema actual
              updatedAt: new Date(),
            },
          });
          console.log(`✅ Paquete individual ${packageId} marcado como PAGADO.`);
        }

        // ==================================================================
        // ESCENARIO C: PAGO DE ALMACENAJE (STORAGE)
        // ==================================================================
        else if (type === 'STORAGE_PAYMENT' && packageIds) {
          const ids = packageIds.split(','); 
          
          // Actualización Masiva: Reseteamos el costo de almacenamiento a 0
          await prisma.package.updateMany({
              where: { id: { in: ids } },
              data: { 
                  storageDebt: 0, // ✅ CORREGIDO: En tu schema se llama 'storageDebt', no 'storageCost'
                  updatedAt: new Date()
              }
          });
          console.log(`✅ Deuda de almacenaje eliminada para ${ids.length} paquetes.`);
        }

        // ==================================================================
        // 2. REGISTRO DE TRANSACCIÓN
        // ==================================================================
        if (userId) {
          // ⚠️ ADVERTENCIA: Tu schema actual NO tiene el modelo 'Transaction'.
          // Si descomentas esto sin agregar el modelo, el build fallará.
          // He comentado este bloque temporalmente para que el build pase.
          
          /* await prisma.transaction.create({
            data: {
              amount: amount,
              type: type || 'UNKNOWN',
              status: 'COMPLETED',
              userId: userId,
              stripePaymentId: stripePaymentId,
              description: description || `Pago procesado: ${type}`,
              packageId: packageId || null, 
              shipmentId: shipmentId || null,
            },
          });
          console.log(`📝 Transacción registrada para usuario ${userId}`);
          */
         console.log(`📝 Pago completado (Transaction omitida por falta de modelo)`);
        }

      } catch (dbError) {
        console.error('❌ Error Crítico en Base de Datos:', dbError);
        return new NextResponse('Database update failed', { status: 500 });
      }
    }

    return new NextResponse(null, { status: 200 });

  } catch (err: any) {
    console.error("Error general en webhook:", err);
    return new NextResponse(`Server Error: ${err.message}`, { status: 500 });
  }
}