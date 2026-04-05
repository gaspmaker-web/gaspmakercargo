import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendNotification } from "@/lib/notifications"; 

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta el ID" }, { status: 400 });

  const order = await prisma.shopperOrder.findUnique({ where: { id } });
  return NextResponse.json({ order });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, itemsSubtotal, usTaxes, domesticShipping, gmcShopperFee, stripeFee, totalAmount } = body;

    const updatedOrder = await prisma.shopperOrder.update({
      where: { id: orderId },
      data: {
        itemsSubtotal, 
        usTaxes,
        domesticShipping,
        gmcShopperFee,
        stripeFee,
        totalAmount,
        status: "QUOTED" 
      },
      include: { user: true } 
    });

    // =========================================================================
    // 🔔 NOTIFICACIÓN MULTILINGÜE INTELIGENTE (VERSIÓN MEJORADA)
    // =========================================================================
    try {
        const user = updatedOrder.user;
        
        // 1. Unimos countryCode y country para tener más pistas del país del cliente
        const userCountry = `${user.countryCode || ''} ${user.country || ''}`.toUpperCase();
        
        let langCode = 'es'; // Español por defecto para toda Latinoamérica

        // 2. Súper Detector de Idiomas
        if (userCountry.includes('US') || userCountry.includes('CA') || userCountry.includes('GB') || userCountry.includes('UNITED STATES') || userCountry.includes('USA')) {
            langCode = 'en';
        } else if (userCountry.includes('BR') || userCountry.includes('BRAZIL') || userCountry.includes('BRASIL')) {
            langCode = 'pt';
        } else if (userCountry.includes('FR') || userCountry.includes('HT') || userCountry.includes('FRANCE') || userCountry.includes('HAITI') || userCountry.includes('CANADA')) {
            langCode = 'fr';
        }

        const translations: Record<string, { title: string, message: string }> = {
            en: { 
                title: "🛍️ Quote Ready", 
                message: `Your order #${orderId.slice(-6).toUpperCase()} has been quoted. Go to the "My Quotes" tab to check the total and pay.` 
            },
            es: { 
                title: "🛍️ Cotización Lista", 
                message: `Tu orden #${orderId.slice(-6).toUpperCase()} ha sido cotizada. Ve a la pestaña "Mis Cotizaciones" para revisar el total y pagar.` 
            },
            pt: { 
                title: "🛍️ Cotação Pronta", 
                message: `Seu pedido #${orderId.slice(-6).toUpperCase()} foi cotado. Vá para a aba "Minhas Cotações" para ver o total e pagar.` 
            },
            fr: { 
                title: "🛍️ Devis Prêt", 
                message: `Votre commande #${orderId.slice(-6).toUpperCase()} a été devisée. Allez dans l'onglet "Mes Devis" pour vérifier le total et payer.` 
            }
        };

        const t = translations[langCode] || translations['es'];

        await sendNotification({
            userId: updatedOrder.userId,
            title: t.title,
            message: t.message,
            href: `/${langCode}/dashboard-cliente/compras`, 
            type: "INFO"
        });
        
    } catch (notifError) {
        console.error("Error enviando notificación multilingüe:", notifError);
    }
    // =========================================================================

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("🔥 ERROR EN LA API DE COTIZACIÓN:", error);
    return NextResponse.json({ error: "Error al cotizar" }, { status: 500 });
  }
}