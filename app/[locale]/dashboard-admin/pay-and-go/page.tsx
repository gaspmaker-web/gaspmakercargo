import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import PayAndGoClient from '@/components/admin/PayAndGoClient';

// 🔥 VACUNA MÁGICA: Obliga a Next.js a verificar el rol en tiempo real, sin usar memoria caché
export const dynamic = 'force-dynamic';

export default async function PayAndGoPage() {
  const session = await auth();

  // Proteger la ruta (Solo ADMIN o WAREHOUSE)
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE')) {
    redirect('/login-admin');
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight italic">Drop & Go</h1>
        <p className="text-gray-500">Recepción rápida y cobro en mostrador para clientes sin cuenta.</p>
      </div>
      
      <PayAndGoClient />
    </div>
  );
}