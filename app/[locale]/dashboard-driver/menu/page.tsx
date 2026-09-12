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
    select: { name: true, email: true, countryCode: true, stripeAccountId: true, image: true }
  })

  const vehicle = await prisma.driverVehicle.findUnique({
    where: { driverId: session.user.id },
    select: {
      type: true, make: true, model: true, year: true,
      licensePlate: true, color: true, status: true,
      vehiclePhotoUrl: true, driverLicenseUrl: true,
      driverLicenseBackUrl: true, insuranceUrl: true,
      isVerified: true, rejectionReason: true
    }
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
         {driver?.image ? (
  <img src={driver.image} alt="Profile" className="w-14 h-14 rounded-full object-cover border-2 border-white/20" />
) : (
  <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold" style={{ backgroundColor: '#F4DBA7', color: '#222b3c' }}>
    {driver?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
  </div>
)}
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

        {/* Vehicle & Documents */}
<div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 pt-4 pb-2">Vehicle & Documents</p>
  {vehicle ? (
    <div className="divide-y divide-gray-100">
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-800">{vehicle.make} {vehicle.model} {vehicle.year}</p>
          <p className="text-xs text-gray-500">{vehicle.licensePlate} · {vehicle.color}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${vehicle.status === 'APPROVED' ? 'bg-green-100 text-green-700' : vehicle.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {vehicle.status}
        </span>
      </div>
      {[
        { label: 'Driver License (Front)', url: vehicle.driverLicenseUrl },
        { label: 'Driver License (Back)', url: vehicle.driverLicenseBackUrl },
        { label: 'Vehicle Photo', url: vehicle.vehiclePhotoUrl },
        { label: 'Insurance Card', url: vehicle.insuranceUrl },
      ].map(({ label, url }) => (
        <div key={label} className="px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-gray-700">{label}</p>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${url ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {url ? '✅ Uploaded' : 'Missing'}
          </span>
        </div>
      ))}
      <Link href={`/${locale}/dashboard-driver/vehicle/register`} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
        <p className="text-sm text-blue-600 font-medium">Update Vehicle Info</p>
        <ChevronRight size={16} className="text-gray-300" />
      </Link>
    </div>
  ) : (
    <Link href={`/${locale}/dashboard-driver/vehicle/register`} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
      <p className="text-sm text-blue-600 font-medium">Register Your Vehicle</p>
      <ChevronRight size={16} className="text-gray-300" />
    </Link>
  )}
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
