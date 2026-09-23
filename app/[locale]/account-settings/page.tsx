import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import AccountContent from './AccountContent';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AccountSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login-cliente');

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { smsConsent: true }
  });

  return <AccountContent smsConsent={dbUser?.smsConsent ?? false} />;
}