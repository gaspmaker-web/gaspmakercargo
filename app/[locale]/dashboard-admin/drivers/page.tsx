import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { CheckCircle, XCircle, Clock, Truck, User } from 'lucide-react'
import VehicleActionButtons from './VehicleActionButtons'

export const dynamic = 'force-dynamic'

export default async function DriversAdminPage(props: any) {
  const session = await auth()
  const params = await props.params
  const locale = params?.locale || 'en'

  if (!session?.user) redirect(`/${locale}/login-cliente`)

  const vehicles = await prisma.driverVehicle.findMany({
    include: {
      driver: {
        select: { name: true, email: true, countryCode: true, phone: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    APPROVED: 'bg-green-100 text-green-700 border-green-200',
    REJECTED: 'bg-red-100 text-red-700 border-red-200',
  }

  const STATUS_ICONS: Record<string, any> = {
    PENDING: Clock,
    APPROVED: CheckCircle,
    REJECTED: XCircle,
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Driver Vehicles</h1>
          <p className="text-sm text-gray-500 mt-1">Review and approve driver vehicle registrations</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Pending', count: vehicles.filter(v => v.status === 'PENDING').length, color: 'text-yellow-600' },
            { label: 'Approved', count: vehicles.filter(v => v.status === 'APPROVED').length, color: 'text-green-600' },
            { label: 'Rejected', count: vehicles.filter(v => v.status === 'REJECTED').length, color: 'text-red-600' },
          ].map(({ label, count, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{count}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Vehicle list */}
        <div className="space-y-4">
          {vehicles.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <Truck size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-400">No vehicle registrations yet</p>
            </div>
          ) : (
            vehicles.map(v => {
              const StatusIcon = STATUS_ICONS[v.status] || Clock
              return (
                <div key={v.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#222b3c] flex items-center justify-center text-sm font-bold" style={{ color: '#F4DBA7' }}>
                        {v.driver.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{v.driver.name}</p>
                        <p className="text-xs text-gray-500">{v.driver.email}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border flex items-center gap-1 ${STATUS_COLORS[v.status]}`}>
                      <StatusIcon size={10} />
                      {v.status}
                    </span>
                  </div>

                  {/* Vehicle info */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { label: 'Type', value: v.type },
                      { label: 'Vehicle', value: `${v.make} ${v.model}` },
                      { label: 'Year', value: v.year.toString() },
                      { label: 'Color', value: v.color },
                      { label: 'Plate', value: v.licensePlate },
                      { label: 'Zone', value: v.driver.countryCode || 'US' },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
                        <p className="text-sm text-gray-700 font-medium">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  {v.status === 'PENDING' && (
                    <VehicleActionButtons vehicleId={v.id} driverId={v.driverId} driverName={v.driver.name || ''} />
                  )}

                  {v.rejectionReason && (
                    <div className="mt-3 bg-red-50 rounded-xl p-3 border border-red-100">
                      <p className="text-xs font-bold text-red-600">Rejection reason:</p>
                      <p className="text-xs text-red-500 mt-0.5">{v.rejectionReason}</p>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
