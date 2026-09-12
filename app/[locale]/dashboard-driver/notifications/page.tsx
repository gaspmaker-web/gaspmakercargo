import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Bell, ArrowLeft, Package, DollarSign, Truck } from 'lucide-react'
import Link from 'next/link'
import ClearNotificationsButton from './ClearNotificationsButton'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage(props: any) {
  const session = await auth()
  const params = await props.params
  const locale = params?.locale || 'en'

  if (!session?.user) redirect(`/${locale}/login-cliente`)

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 30
  })

  // Mark all as read
  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true }
  })

  const getIcon = (type: string) => {
    if (type === 'SUCCESS') return <DollarSign size={18} className="text-green-600" />
    if (type === 'INFO') return <Package size={18} className="text-blue-600" />
    return <Truck size={18} className="text-yellow-600" />
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="bg-[#222b3c] text-white px-5 pt-10 pb-6">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/dashboard-driver`} className="p-2 rounded-full bg-white/10">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center justify-between flex-1">
  <h1 className="text-xl font-bold">Inbox</h1>
  <ClearNotificationsButton />
</div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <Bell size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">No notifications yet</p>
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.id} className={`bg-white rounded-2xl p-4 border flex items-start gap-3 ${!n.isRead ? 'border-blue-200 bg-blue-50' : 'border-gray-100'}`}>
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
