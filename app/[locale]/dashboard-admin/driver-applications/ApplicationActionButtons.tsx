'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  applicationId: string
  applicantEmail: string
  applicantName: string
}

export default function ApplicationActionButtons({ applicationId, applicantEmail, applicantName }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)

  const updateStatus = async (status: 'APPROVED' | 'REJECTED') => {
    setLoading(status === 'APPROVED' ? 'approve' : 'reject')
    await fetch('/api/admin/driver-applications/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId, status, applicantEmail, applicantName }),
    })
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => updateStatus('APPROVED')}
        disabled={loading !== null}
        className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2"
      >
        {loading === 'approve' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
        Approve
      </button>
      <button
        onClick={() => updateStatus('REJECTED')}
        disabled={loading !== null}
        className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-xl flex items-center justify-center gap-2 border border-red-200"
      >
        {loading === 'reject' ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
        Reject
      </button>
    </div>
  )
}
