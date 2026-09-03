'use client'

import { useState } from 'react'
import { CreditCard, ExternalLink, Loader2 } from 'lucide-react'

interface StripeConnectButtonProps {
  hasAccount: boolean
}

export default function StripeConnectButton({ hasAccount }: StripeConnectButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleSetup = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/connect/onboard', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      alert('Error connecting Stripe. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDashboard = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/connect/dashboard')
      const data = await res.json()
      if (data.url) window.open(data.url, '_blank')
    } catch {
      alert('Error opening dashboard. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (hasAccount) {
    return (
      <button
        onClick={handleDashboard}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 bg-[#222b3c] hover:bg-[#2d3a50] text-white text-sm font-semibold rounded-2xl border border-white/10 transition-colors w-full justify-center"
      >
        {loading
          ? <Loader2 size={16} className="animate-spin" />
          : <ExternalLink size={16} className="text-green-400" />
        }
        View Earnings & Payouts
      </button>
    )
  }

  return (
    <button
      onClick={handleSetup}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2.5 bg-[#222b3c] hover:bg-[#2d3a50] text-white text-sm font-semibold rounded-2xl border border-white/10 transition-colors w-full justify-center"
    >
      {loading
        ? <Loader2 size={16} className="animate-spin" />
        : <CreditCard size={16} className="text-yellow-400" />
      }
      Setup Payment Account
    </button>
  )
}
