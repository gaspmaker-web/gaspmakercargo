import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { ArrowLeft, User, Phone, Mail, MapPin } from 'lucide-react'
import Link from 'next/link'
import ProfilePhotoUpload from './ProfilePhotoUpload'

export const dynamic = 'force-dynamic'

export default async function DriverProfilePage(props: any) {
  const session = await auth()
  const params = await props.params
  const locale = params?.locale || 'en'

  if (!session?.user) redirect(`/${locale}/login-cliente`)

  const driver = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true, countryCode: true, country: true, createdAt: true, image: true }
  })

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="bg-[#222b3c] text-white px-5 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/${locale}/dashboard-driver/menu`} className="p-2 rounded-full bg-white/10">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-bold">Profile</h1>
        </div>
        <div className="flex items-center gap-4">
          <ProfilePhotoUpload currentImage={driver?.image || null} driverName={driver?.name || 'Driver'} />
          <div>
            <p className="font-bold text-lg">{driver?.name}</p>
            <p className="text-xs text-gray-400">Driver since {new Date(driver?.createdAt || '').getFullYear()}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-3">
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
          {[
            { icon: User, label: 'Full Name', value: driver?.name || '—' },
            { icon: Mail, label: 'Email', value: driver?.email || '—' },
            { icon: Phone, label: 'Phone', value: driver?.phone || '—' },
            { icon: MapPin, label: 'Zone', value: `${driver?.countryCode || 'US'} — ${driver?.country || 'United States'}` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-3.5">
              <Icon size={18} className="text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold">{label}</p>
                <p className="text-sm text-gray-800 font-medium">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
