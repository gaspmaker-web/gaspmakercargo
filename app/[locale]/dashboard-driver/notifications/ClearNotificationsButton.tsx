'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ClearNotificationsButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleClear = async () => {
    if (!confirm('Clear all notifications?')) return
    setLoading(true)
    await fetch('/api/driver/notifications/clear', { method: 'DELETE' })
    setLoading(false)
    router.refresh()
  }

  return (
    <button onClick={handleClear} disabled={loading} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors">
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
      Clear all
    </button>
  )
}
