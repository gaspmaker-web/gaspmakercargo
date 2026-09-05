'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Truck, Radio, ChevronRight } from 'lucide-react'

const LiveDriversMap = dynamic(() => import('@/components/admin/LiveDriversMap'), { ssr: false })

interface Driver {
  id: string
  name: string
  countryCode: string | null
}

interface Delivery {
  id: string
  originAddress: string
  dropOffAddress: string | null
  status: string
  driverId: string | null
  serviceType: string
  pickupDate: Date | null
}

interface Consolidation {
  id: string
  gmcShipmentNumber: string
  shippingAddress: string | null
  status: string
  weightLbs: number | null
  destinationCountryCode: string | null
  user: { name: string }
}

interface Props {
  drivers: Driver[]
  activeDeliveries: Delivery[]
  activeConsolidations: Consolidation[]
  locale: string
}

const STATUS_COLORS: Record<string, string> = {
  ACEPTADO: 'bg-blue-100 text-blue-700',
  EN_CAMINO: 'bg-yellow-100 text-yellow-700',
  EN_REPARTO: 'bg-orange-100 text-orange-700',
  EN_RUTA: 'bg-purple-100 text-purple-700',
  OUT_FOR_DELIVERY: 'bg-green-100 text-green-700',
}

export default function DispatchClient({ drivers, activeDeliveries, activeConsolidations }: Props) {
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null)

  const getDriverDeliveries = (driverId: string) =>
    activeDeliveries.filter(d => d.driverId === driverId)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <h1 className="text-lg font-bold tracking-wide uppercase">Dispatch Control Center</h1>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Radio size={12} className="text-green-400" />
            {drivers.length} drivers registered
          </span>
          <span className="flex items-center gap-1">
            <Truck size={12} className="text-yellow-400" />
            {activeDeliveries.length + activeConsolidations.length} active deliveries
          </span>
        </div>
      </div>

      <div className="flex h-[calc(100vh-65px)]">
        <div className="flex-1 relative">
          <LiveDriversMap />
        </div>

        <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Drivers</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {drivers.map(driver => {
              const deliveries = getDriverDeliveries(driver.id)
              const isSelected = selectedDriver === driver.id

              return (
                <div key={driver.id}>
                  <button
                    onClick={() => setSelectedDriver(isSelected ? null : driver.id)}
                    className={`w-full px-4 py-3 flex items-center gap-3 border-b border-gray-800 hover:bg-gray-800 transition-colors text-left ${isSelected ? 'bg-gray-800' : ''}`}
                  >
                    <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-yellow-400 flex-shrink-0">
                      {driver.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{driver.name}</p>
                      <p className="text-xs text-gray-500">{deliveries.length} active · {driver.countryCode || 'US'}</p>
                    </div>
                    <ChevronRight size={14} className={`text-gray-500 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                  </button>

                  {isSelected && (
                    <div className="border-b border-gray-800">
                      {deliveries.length === 0 ? (
                        <p className="px-6 py-3 text-xs text-gray-500">No active deliveries</p>
                      ) : (
                        deliveries.map(d => (
                          <div key={d.id} className="px-6 py-3 border-t border-gray-800">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[d.status] || 'bg-gray-700 text-gray-300'}`}>
                                {d.status}
                              </span>
                              <span className="text-[10px] text-gray-500">{d.serviceType}</span>
                            </div>
                            <p className="text-xs text-gray-300 truncate mt-1">{d.originAddress}</p>
                            {d.dropOffAddress && (
                              <p className="text-xs text-gray-500 truncate">→ {d.dropOffAddress}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {activeConsolidations.length > 0 && (
            <div className="border-t border-gray-800">
              <div className="px-4 py-3 border-b border-gray-800">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Active Shipments ({activeConsolidations.length})
                </p>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {activeConsolidations.map(c => (
                  <div key={c.id} className="px-4 py-3 border-b border-gray-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-yellow-400">{c.gmcShipmentNumber}</span>
                      <span className="text-[10px] text-gray-500">{c.destinationCountryCode}</span>
                    </div>
                    <p className="text-xs text-gray-300 truncate mt-1">{c.user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{c.shippingAddress}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
