import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import VehicleRegisterForm from './VehicleRegisterForm'

export const dynamic = 'force-dynamic'

export default async function VehicleRegisterPage(props: any) {
  const session = await auth()
  const params = await props.params
  const locale = params?.locale || 'en'

  if (!session?.user) redirect(`/${locale}/login-cliente`)

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="bg-[#222b3c] text-white px-5 pt-10 pb-6">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/dashboard-driver`} className="p-2 rounded-full bg-white/10">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Register Your Vehicle</h1>
            <p className="text-xs text-gray-400 mt-0.5">Required to start receiving deliveries</p>
          </div>
        </div>
      </div>
      <VehicleRegisterForm locale={locale} driverId={session.user.id} />
    </div>
  )
}
