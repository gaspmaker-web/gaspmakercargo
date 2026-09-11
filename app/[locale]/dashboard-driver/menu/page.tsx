import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { ArrowLeft, User, CreditCard, MapPin, ChevronRight, Shield } from 'lucide-react'
import Link from 'next/link'
import DriverLogoutButton from '@/components/DriverLogoutButton'
import StripeConnectButton from '@/components/driver/StripeConnectButton'

export const dynamic = 'force-dynamic'

export default async function MenuPage(props: any) {
  const session = await auth()
  const params = await props.params
  const locale = params?.locale || 'en'

  if (!session?.user) redirect(`/${locale}/login-cliente`)

  const driver = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, countryCode: true, stripeAccountId: true }
  })

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="bg-[#222b3c] text-white px-5 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/${locale}/dashboard-driver`} className="p-2 rounded-full bg-white/10">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-bold">Menu</h1>
        </div>

        {/* Driver profile */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: '#F4DBA7', color: '#222b3c' }}>
            {driver?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-lg">{driver?.name}</p>
            <p className="text-xs text-gray-400">{driver?.email}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <MapPin size={10} /> Zone: {driver?.countryCode || 'US'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Payment */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 pt-4 pb-2">Payments</p>
          <div className="px-4 pb-4">
            <StripeConnectButton hasAccount={!!driver?.stripeAccountId} />
          </div>
        </div>

        {/* Links */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 pt-4 pb-2">Account</p>
          {[
            { icon: User, label: 'Profile', href: `/${locale}/dashboard-driver/profile` },
            { icon: Shield, label: 'Privacy & Security', href: `/${locale}/dashboard-driver/privacy` },
            { icon: CreditCard, label: 'Earnings History', href: `/${locale}/dashboard-driver/earnings` },
          ].map(({ icon: Icon, label, href }) => (
            <Link key={label} href={href} className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Icon size={18} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </Link>
          ))}
        </div>

        {/* Logout */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <DriverLogoutButton locale={locale} />
        </div>
      </div>
    </div>
  )
}
