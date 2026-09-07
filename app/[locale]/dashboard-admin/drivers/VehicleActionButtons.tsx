'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  vehicleId: string
  driverId: string
  driverName: string
}

export default function VehicleActionButtons({ vehicleId, driverId, driverName }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [reason, setReason] = useState('')

  const approve = async () => {
    setLoading('approve')
    await fetch('/api/admin/driver-vehicle/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleId, driverId }),
    })
    setLoading(null)
    router.refresh()
  }

  const reject = async () => {
    if (!reason.trim()) { alert('Please provide a rejection reason'); return }
    setLoading('reject')
    await fetch('/api/admin/driver-vehicle/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleId, driverId, reason }),
    })
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {!showRejectForm ? (
        <div className="flex gap-3">
          <button
            onClick={approve}
            disabled={loading !== null}
            className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {loading === 'approve' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            Approve
          </button>
          <button
            onClick={() => setShowRejectForm(true)}
            disabled={loading !== null}
            className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-red-200"
          >
            <XCircle size={16} />
            Reject
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Rejection reason (e.g. Insurance expired, Wrong vehicle type...)"
            className="w-full border border-red-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400 bg-red-50"
            rows={2}
          />
          <div className="flex gap-2">
            <button onClick={() => setShowRejectForm(false)} className="flex-1 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl">
              Cancel
            </button>
            <button
              onClick={reject}
              disabled={loading !== null}
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2"
            >
              {loading === 'reject' ? <Loader2 size={14} className="animate-spin" /> : 'Confirm Reject'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
