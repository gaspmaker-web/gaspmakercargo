// app/[locale]/dashboard-cliente/mailbox-setup/page.tsx
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe"; // 🔥 IMPORTAMOS STRIPE
import MailboxSetupClient from "./MailboxSetupClient";

export const dynamic = 'force-dynamic';

export default async function MailboxSetupPage() {
  const session = await auth();
  
  let finalCards: any[] = [];

  if (session?.user?.id) {
    const savedCards = await prisma.paymentMethod.findMany({
      where: { 
        userId: session.user.id 
      },
      select: {
        id: true,
        brand: true,
        last4: true,
        stripePaymentMethodId: true // 🔥 Necesitamos esto para buscar el país en Stripe
      }
    });

    // 🔥 NIVEL ENTERPRISE: Cruzamos los datos con Stripe para obtener el país (country)
    finalCards = await Promise.all(
      savedCards.map(async (card) => {
        try {
          const stripePm = await stripe.paymentMethods.retrieve(card.stripePaymentMethodId);
          return {
            id: card.id,
            brand: card.brand,
            last4: card.last4,
            country: stripePm.card?.country || null // <- Extraemos el país ('TT', 'US', etc.)
          };
        } catch (error) {
          console.error(`Error consultando Stripe para la tarjeta ${card.id}:`, error);
          return {
            id: card.id,
            brand: card.brand,
            last4: card.last4,
            country: null
          };
        }
      })
    );
  }

  // Le pasamos las tarjetas enriquecidas con el país real al cliente
  return <MailboxSetupClient savedCards={finalCards} />;
}