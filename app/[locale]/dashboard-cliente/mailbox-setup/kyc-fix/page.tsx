import React from 'react';
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from 'next/navigation';
import KycFixClient from './KycFixClient';

interface Props {
  params: { locale: string };
  searchParams: { id?: string };
}

export default async function KycFixPage({ params: { locale }, searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login-cliente`);
  }

  const recipientId = searchParams.id;
  if (!recipientId) {
    redirect(`/${locale}/dashboard-cliente/buzon`);
  }

  // Buscamos a la persona rechazada y nos aseguramos de que pertenezca a este usuario
  const recipient = await prisma.additionalRecipient.findFirst({
    where: { 
        id: recipientId,
        subscription: { userId: session.user.id }
    }
  });

  // Si no existe o no está rechazada, lo devolvemos al buzón
  if (!recipient || recipient.status !== 'REJECTED') {
     redirect(`/${locale}/dashboard-cliente/buzon`);
  }

  return (
    <KycFixClient 
        locale={locale} 
        recipientId={recipient.id} 
        fullName={recipient.fullName} 
        rejectionReason={recipient.rejectionReason} 
    />
  );
}