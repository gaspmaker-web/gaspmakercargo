'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Car, Loader2, CheckCircle } from 'lucide-react'

interface Props {
  locale: string
  driverId: string
}

const VEHICLE_TYPES = [
  { value: 'CAR_SUV', label: 'Car / SUV', desc: 'Up to 50 lbs · Max 4ft long' },
  { value: 'MINIVAN', label: 'Minivan / Transit', desc: 'Up to 100 lbs · Medium cargo' },
  { value: 'CARGO_VAN', label: 'Cargo Van', desc: 'Up to 200 lbs · Large cargo' },
  { value: 'BOX_TRUCK', label: 'Box Truck', desc: 'Pallets · Heavy cargo' },
]

export default function VehicleRegisterForm({ locale, driverId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    type: '', make: '', model: '', year: '', color: '', licensePlate: '',
  })
 const [files, setFiles] = useState<Record<string, File | null>>({
  vehicle: null, license: null, licenseBack: null, insurance: null,
})

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'vehicle' | 'license' | 'licenseBack' | 'insurance') => {
    const file = e.target.files?.[0]
    if (!file) return
    setFiles(f => ({ ...f, [field]: file }))
  }

const uploadFile = async (file: File): Promise<string | null> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string
        const formData = new FormData()
        formData.append('file', base64)
        formData.append('upload_preset', 'ml_default')
        const res = await fetch('https://api.cloudinary.com/v1_1/dcu36bfyt/image/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        resolve(data.secure_url || null)
      } catch {
        resolve(null)
      }
    }
    reader.readAsDataURL(file)
  })
}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.type || !form.make || !form.model || !form.year || !form.color || !form.licensePlate) {
      alert('Please fill all fields')
      return
    }
    setLoading(true)
    try {
      const vehiclePhotoUrl = files.vehicle ? await uploadFile(files.vehicle) : null
      const driverLicenseUrl = files.license ? await uploadFile(files.license) : null
      const driverLicenseBackUrl = files.licenseBack ? await uploadFile(files.licenseBack) : null
      const insuranceUrl = files.insurance ? await uploadFile(files.insurance) : null

      const res = await fetch('/api/driver/vehicle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
  ...form,
  year: parseInt(form.year),
  vehiclePhotoUrl,
  driverLicenseUrl,
  driverLicenseBackUrl,
  insuranceUrl,
}),
      })
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => router.push(`/${locale}/dashboard-driver`), 2000)
      } else {
        alert('Error registering vehicle. Try again.')
      }
    } catch {
      alert('Connection error.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <CheckCircle size={48} className="text-green-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Vehicle Submitted!</h2>
        <p className="text-gray-500 text-sm">Our team will review your information within 24 hours.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
      {/* Vehicle Type */}
      <div>
        <p className="text-sm font-bold text-gray-700 mb-3">Vehicle Type *</p>
        <div className="grid grid-cols-2 gap-3">
          {VEHICLE_TYPES.map(v => (
            <button key={v.value} type="button"
              onClick={() => setForm(f => ({ ...f, type: v.value }))}
              className={`p-3 rounded-2xl border-2 text-left transition-all ${form.type === v.value ? 'border-[#222b3c] bg-[#222b3c]/5' : 'border-gray-200 bg-white'}`}
            >
              <p className="text-sm font-bold text-gray-800">{v.label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{v.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Vehicle Details */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
        <p className="text-sm font-bold text-gray-700">Vehicle Details</p>
        {[
          { key: 'make', label: 'Make', placeholder: 'Toyota, Ford, Honda...' },
          { key: 'model', label: 'Model', placeholder: 'Camry, Transit, Civic...' },
          { key: 'year', label: 'Year', placeholder: '2020', type: 'number' },
          { key: 'color', label: 'Color', placeholder: 'White, Black, Silver...' },
          { key: 'licensePlate', label: 'License Plate', placeholder: 'ABC-1234' },
        ].map(({ key, label, placeholder, type }) => (
          <div key={key}>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{label} *</label>
            <input type={type || 'text'} placeholder={placeholder}
              value={form[key as keyof typeof form]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>
        ))}
      </div>

      {/* Documents */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
        <p className="text-sm font-bold text-gray-700">Required Documents</p>
        <p className="text-xs text-gray-400">Select your photos — they will upload when you tap Submit.</p>
        {[
          { field: 'vehicle' as const, label: 'Vehicle Photo', desc: 'Photo of your vehicle' },
          { field: 'license' as const, label: 'Driver License (Front)', desc: 'Front of your driver license' },
          { field: 'licenseBack' as const, label: 'Driver License (Back)', desc: 'Back of your driver license' },  
          { field: 'insurance' as const, label: 'Insurance Card', desc: 'Current auto insurance card' },
        ].map(({ field, label, desc }) => (
          <div key={field}>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{label} *</label>
            <p className="text-xs text-gray-400 mb-2">{desc}</p>
            <input type="file" accept="image/*" capture="environment"
              onChange={e => handleFileChange(e, field)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
            />
            {files[field] && <p className="text-xs text-green-600 mt-1">✅ {files[field]?.name}</p>}
          </div>
        ))}
      </div>

      <button type="submit" disabled={loading}
        className="w-full py-4 text-white text-base font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors"
        style={{ backgroundColor: '#222b3c' }}
      >
        {loading ? <Loader2 size={20} className="animate-spin" /> : <Car size={20} style={{ color: '#F4DBA7' }} />}
        {loading ? 'Uploading & Submitting...' : 'Submit for Review'}
      </button>
    </form>
  )
}
