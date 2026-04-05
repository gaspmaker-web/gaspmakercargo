// app/[locale]/dashboard-cliente/mailbox-setup/page.tsx
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import MailboxSetupClient from "./MailboxSetupClient";

export const dynamic = 'force-dynamic';

export default async function MailboxSetupPage() {
  const session = await auth();
  
  let savedCards: any[] = [];

  // Si el usuario está logueado, buscamos sus tarjetas en Prisma
  if (session?.user?.id) {
    savedCards = await prisma.paymentMethod.findMany({
      where: { 
        userId: session.user.id 
      },
      select: {
        id: true,
        brand: true,
        last4: true,
      }
    });
  }

  // Le pasamos las tarjetas reales al componente cliente que acabas de renombrar
  return <MailboxSetupClient savedCards={savedCards} />;
}