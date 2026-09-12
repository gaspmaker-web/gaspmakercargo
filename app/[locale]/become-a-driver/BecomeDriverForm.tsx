'use client'

import { useState } from 'react'
import { Loader2, CheckCircle } from 'lucide-react'

const ZONES = [
  { value: 'US', label: '🇺🇸 Miami, Florida' },
  { value: 'BB', label: '🇧🇧 Barbados' },
  { value: 'TT', label: '🇹🇹 Trinidad & Tobago' },
  { value: 'JM', label: '🇯🇲 Jamaica' },
]

const VEHICLE_TYPES = [
  { value: 'CAR_SUV', label: 'Car / SUV' },
  { value: 'MINIVAN', label: 'Minivan / Transit' },
  { value: 'CARGO_VAN', label: 'Cargo Van' },
  { value: 'BOX_TRUCK', label: 'Box Truck' },
]

export default function BecomeDriverForm() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', zone: '', vehicleType: '', hasInsurance: '', message: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.phone || !form.zone || !form.vehicleType) {
      alert('Please fill all required fields')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/become-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSuccess(true)
      } else {
        alert('Error submitting application. Please try again.')
      }
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
        <h3 className="text-xl font-bold text-gray-900 mb-2">Application Submitted!</h3>
        <p className="text-gray-500 text-sm">Thank you for your interest in driving with Gasp Maker. Our team will review your application and contact you within 24-48 hours.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Full Name *</label>
          <input type="text" placeholder="John Smith"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Email *</label>
          <input type="email" placeholder="john@email.com"
            value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Phone *</label>
          <input type="tel" placeholder="+1 (305) 000-0000"
            value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Zone *</label>
          <select value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400">
            <option value="">Select your zone</option>
            {ZONES.map(z => <option key={z.value} value={z.value}>{z.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Vehicle Type *</label>
          <select value={form.vehicleType} onChange={e => setForm(f => ({ ...f, vehicleType: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400">
            <option value="">Select vehicle type</option>
            {VEHICLE_TYPES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Do you have auto insurance?</label>
          <select value={form.hasInsurance} onChange={e => setForm(f => ({ ...f, hasInsurance: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400">
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Additional Information</label>
        <textarea placeholder="Tell us about your driving experience..."
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
        {loading ? 'Submitting...' : 'Submit Application'}
      </button>
    </form>
  )
}
