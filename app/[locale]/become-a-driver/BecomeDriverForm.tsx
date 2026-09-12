'use client'

import { useState } from 'react'
import { Loader2, CheckCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

const ZONES = [
  { value: 'US', label: '🇺🇸 Miami, Florida' },
]

const VEHICLE_TYPES = [
  { value: 'CAR_SUV', label: 'Car / SUV' },
  { value: 'MINIVAN', label: 'Minivan / Transit' },
  { value: 'CARGO_VAN', label: 'Cargo Van' },
  { value: 'BOX_TRUCK', label: 'Box Truck' },
]

export default function BecomeDriverForm({ locale }: { locale: string }) {
  const t = useTranslations('BecomeDriver')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', zone: '', vehicleType: '', hasInsurance: '', message: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.phone || !form.zone || !form.vehicleType) {
      alert(t('form_required'))
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/become-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) setSuccess(true)
      else alert('Error submitting application. Please try again.')
    } catch {
      alert('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-12">
        <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">{t('success_title')}</h3>
        <p className="text-gray-500 text-sm">{t('success_desc')}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t('form_name')} *</label>
          <input type="text" placeholder="John Smith"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t('form_email')} *</label>
          <input type="email" placeholder="john@email.com"
            value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t('form_phone')} *</label>
          <input type="tel" placeholder="+1 (305) 000-0000"
            value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t('form_zone')} *</label>
          <select value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400">
            <option value="">{t('form_zone_placeholder')}</option>
            {ZONES.map(z => <option key={z.value} value={z.value}>{z.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t('form_vehicle')} *</label>
          <select value={form.vehicleType} onChange={e => setForm(f => ({ ...f, vehicleType: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400">
            <option value="">{t('form_vehicle_placeholder')}</option>
            {VEHICLE_TYPES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t('form_insurance')}</label>
          <select value={form.hasInsurance} onChange={e => setForm(f => ({ ...f, hasInsurance: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400">
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t('form_message')}</label>
        <textarea placeholder={t('form_message_placeholder')}
          value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
        />
      </div>
      <button type="submit" disabled={loading}
        className="w-full py-4 text-white text-base font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors"
        style={{ backgroundColor: '#222b3c' }}
      >
        {loading ? <Loader2 size={20} className="animate-spin" /> : null}
        {loading ? t('form_submitting') : t('form_submit')}
      </button>
    </form>
  )
}
