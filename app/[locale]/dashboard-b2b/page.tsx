import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { Truck, DollarSign, Clock, Package, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardB2BPage(props: any) {
  const params = await props.params;
  const locale = params.locale || 'en';
  const session = await auth();

  if (!session?.user || (session.user as any).role !== 'B2B_STORE') {
    redirect(`/${locale}/login-cliente`);
  }

  const b2b = await prisma.b2BAccount.findUnique({
    where: { userId: session.user.id }
  });

  const recentPickups = await prisma.pickupRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  const creditAvailable = (b2b?.creditLimit || 500) - (b2b?.creditUsed || 0);
  const creditPct = Math.min(100, ((b2b?.creditUsed || 0) / (b2b?.creditLimit || 500)) * 100);

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      {/* Header */}
      <div className="bg-[#222b3c] text-white px-5 pt-10 pb-8">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Business Account</p>
        <h1 className="text-2xl font-bold font-garamond">{b2b?.businessName || session.user.name}</h1>
        <p className="text-xs text-gray-400 mt-1">{b2b?.businessAddress}</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Credit Balance */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Monthly Credit</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${b2b?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {b2b?.status || 'ACTIVE'}
            </span>
          </div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-3xl font-bold text-gray-900">${creditAvailable.toFixed(2)}</span>
            <span className="text-sm text-gray-400">of ${b2b?.creditLimit?.toFixed(2) || '500.00'}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-gmc-dorado-principal h-2 rounded-full" style={{ width: `${creditPct}%` }} />
          </div>
          {b2b?.nextBillingDate && (
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <Clock size={10} /> Next billing: {new Date(b2b.nextBillingDate).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <Link href={`/${locale}/dashboard-cliente/solicitar-pickup?pickup=${encodeURIComponent(b2b?.businessAddress || '')}&b2b=true`}
          className="block bg-[#222b3c] text-white rounded-2xl p-5 hover:bg-[#2d3748] transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">New Delivery</p>
              <p className="text-lg font-bold">Request a Driver</p>
              <p className="text-xs text-gray-400 mt-1">Pickup from {b2b?.businessName}</p>
            </div>
            <div className="bg-gmc-dorado-principal p-3 rounded-xl">
              <Plus size={24} className="text-[#222b3c]" />
            </div>
          </div>
        </Link>

        {/* Recent Deliveries */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Deliveries</p>
          </div>
          {recentPickups.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">No deliveries yet.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentPickups.map(pickup => (
                <div key={pickup.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{pickup.dropOffAddress}</p>
                    <p className="text-xs text-gray-400">{new Date(pickup.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">${pickup.totalPaid?.toFixed(2) || '0.00'}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      pickup.status === 'ENTREGADO' ? 'bg-green-100 text-green-700' :
                      pickup.status === 'PAGADO' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{pickup.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
