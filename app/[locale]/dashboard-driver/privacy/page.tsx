import { ArrowLeft, Lock } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DriverPrivacyPage(props: any) {
  const params = await props.params
  const locale = params?.locale || 'en'

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="bg-[#222b3c] text-white px-5 pt-10 pb-6">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/dashboard-driver/menu`} className="p-2 rounded-full bg-white/10">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-bold">Privacy Policy</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Lock size={20} className="text-gray-500" />
            <h2 className="font-bold text-gray-900">Data We Collect</h2>
          </div>
          <p className="text-sm text-gray-600">We collect your name, email, phone number, vehicle information, driver license, insurance documents, and GPS location data while you are online.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-3">GPS Location</h2>
          <p className="text-sm text-gray-600">Your location is only tracked when you are online and actively delivering. Location data is shared with customers tracking their delivery and with our dispatch team. Location tracking stops immediately when you go offline.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-3">Your Documents</h2>
          <p className="text-sm text-gray-600">Driver license, vehicle photo, and insurance documents are used solely for identity verification. They are stored securely and never shared with third parties.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-3">Payment Data</h2>
          <p className="text-sm text-gray-600">Payment information is processed securely through Stripe Connect. Gasp Maker LLC never stores your bank account or routing numbers directly.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-3">Contact</h2>
          <p className="text-sm text-gray-600">For privacy questions contact us at <a href="mailto:support@gaspmakercargo.com" className="text-blue-600">support@gaspmakercargo.com</a></p>
        </div>
      </div>
    </div>
  )
}
