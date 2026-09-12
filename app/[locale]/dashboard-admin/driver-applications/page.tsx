import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Truck, Clock, CheckCircle, XCircle } from 'lucide-react'
import ApplicationActionButtons from './ApplicationActionButtons'

export const dynamic = 'force-dynamic'

export default async function DriverApplicationsPage(props: any) {
  const session = await auth()
  const params = await props.params
  const locale = params?.locale || 'en'

  if (!session?.user) redirect(`/${locale}/login-cliente`)

  const applications = await prisma.driverApplication.findMany({
    orderBy: { createdAt: 'desc' }
  })

  const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
  }

  const ZONE_LABELS: Record<string, string> = {
    US: '🇺🇸 Miami, FL',
    BB: '🇧🇧 Barbados',
    TT: '🇹🇹 Trinidad',
    JM: '🇯🇲 Jamaica',
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Driver Applications</h1>
          <p className="text-sm text-gray-500 mt-1">Review and manage driver applications</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Pending', count: applications.filter(a => a.status === 'PENDING').length, color: 'text-yellow-600' },
            { label: 'Approved', count: applications.filter(a => a.status === 'APPROVED').length, color: 'text-green-600' },
            { label: 'Rejected', count: applications.filter(a => a.status === 'REJECTED').length, color: 'text-red-600' },
          ].map(({ label, count, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{count}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Applications list */}
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <Truck size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-400">No applications yet</p>
            </div>
          ) : (
            applications.map(app => (
              <div key={app.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{app.name}</p>
                    <p className="text-xs text-gray-500">{app.email} · {app.phone}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${STATUS_COLORS[app.status]}`}>
                    {app.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: 'Zone', value: ZONE_LABELS[app.zone] || app.zone },
                    { label: 'Vehicle', value: app.vehicleType },
                    { label: 'Insurance', value: app.hasInsurance || 'Not specified' },
                    { label: 'Applied', value: new Date(app.createdAt).toLocaleDateString() },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
                      <p className="text-sm text-gray-700">{value}</p>
                    </div>
                  ))}
                </div>

                {app.message && (
                  <div className="bg-gray-50 rounded-xl p-3 mb-4">
                    <p className="text-xs text-gray-500">{app.message}</p>
                  </div>
                )}

                {app.status === 'PENDING' && (
                  <ApplicationActionButtons applicationId={app.id} applicantEmail={app.email} applicantName={app.name} />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
