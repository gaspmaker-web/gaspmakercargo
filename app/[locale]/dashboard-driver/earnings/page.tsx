import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { DollarSign, TrendingUp, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EarningsPage(props: any) {
  const session = await auth()
  const params = await props.params
  const locale = params?.locale || 'en'

  if (!session?.user) redirect(`/${locale}/login-cliente`)

  const transfers = await prisma.driverSession.findUnique({
    where: { driverId: session.user.id },
    select: { isOnline: true, lastSeen: true }
  })

  const completedDeliveries = await prisma.pickupRequest.findMany({
    where: { driverId: session.user.id, status: 'ENTREGADO' },
    select: { id: true, totalPaid: true, updatedAt: true, originAddress: true, dropOffAddress: true },
    orderBy: { updatedAt: 'desc' },
    take: 20
  })

  const totalEarned = completedDeliveries.reduce((sum, d) => sum + (d.totalPaid || 0) * 0.7, 0)

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <div className="bg-[#222b3c] text-white px-5 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/${locale}/dashboard-driver`} className="p-2 rounded-full bg-white/10">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-bold">Earnings</h1>
        </div>
        <div className="bg-white/10 rounded-2xl p-4">
          <p className="text-xs text-gray-400 mb-1">Total Earned</p>
          <p className="text-3xl font-bold" style={{ color: '#F4DBA7' }}>
            ${totalEarned.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{completedDeliveries.length} deliveries completed</p>
        </div>
      </div>

      {/* Delivery list */}
      <div className="px-4 py-6 space-y-3">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Recent Deliveries</h2>
        {completedDeliveries.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <DollarSign size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">No completed deliveries yet</p>
          </div>
        ) : (
          completedDeliveries.map(d => (
            <div key={d.id} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">{d.originAddress}</p>
                  <p className="text-xs text-gray-400">{new Date(d.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
              <p className="text-sm font-bold text-green-600">+${((d.totalPaid || 0) * 0.7).toFixed(2)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
