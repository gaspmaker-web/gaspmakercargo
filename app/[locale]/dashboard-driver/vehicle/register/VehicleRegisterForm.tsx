'use client'
import { useRouter } from 'next/navigation'
import { useState, useRef } from 'react'
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
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    type: '',
    make: '',
    model: '',
    year: '',
    color: '',
    licensePlate: '',
  })
  const [docs, setDocs] = useState<Record<string, string>>({
    vehiclePhotoUrl: '',
    driverLicenseUrl: '',
    insuranceUrl: '',
  })

  const docsRef = useRef<Record<string, string>>({
  vehiclePhotoUrl: '',
  driverLicenseUrl: '',
  insuranceUrl: '',
})

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', 'ml_default')
const res = await fetch(`https://api.cloudinary.com/v1_1/dcu36bfyt/image/upload`, {
        method: 'POST',
        body: formData,
      })
     const data = await res.json()
if (!data.secure_url) {
  alert('Cloudinary error: ' + JSON.stringify(data))
  return
}
docsRef.current[key] = data.secure_url
setDocs({ ...docsRef.current })
        } catch (err: any) {
      alert('Upload error: ' + JSON.stringify(err))
    } finally {
      setUploading(false)
    }
  }

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!form.type || !form.make || !form.model || !form.year || !form.color || !form.licensePlate) {
    alert('Please fill all fields')
    return
  }
    setLoading(true)
    try {
      const res = await fetch('/api/driver/vehicle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, year: parseInt(form.year), ...docsRef.current }),
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
            <button
              key={v.value}
              type="button"
              onClick={() => setForm(f => ({ ...f, type: v.value }))}
              className={`p-3 rounded-2xl border-2 text-left transition-all ${
                form.type === v.value ? 'border-[#222b3c] bg-[#222b3c]/5' : 'border-gray-200 bg-white'
              }`}
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
            <input
              type={type || 'text'}
              placeholder={placeholder}
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
        {[
          { key: 'vehiclePhotoUrl', label: 'Vehicle Photo', desc: 'Take a photo of your vehicle' },
          { key: 'driverLicenseUrl', label: 'Driver License', desc: 'Front of your driver license' },
          { key: 'insuranceUrl', label: 'Insurance Card', desc: 'Current auto insurance card' },
        ].map(({ key, label, desc }) => (
          <div key={key}>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{label} *</label>
            <p className="text-xs text-gray-400 mb-2">{desc}</p>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={e => handleFileUpload(e, key)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
            />
            {docs[key] && <p className="text-xs text-green-600 mt-1">✅ Uploaded</p>}
          </div>
        ))}
      </div>

      {uploading && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" /> Uploading document...
        </div>
      )}

      <button
        type="submit"
        disabled={loading || uploading}
        className="w-full py-4 text-white text-base font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors"
        style={{ backgroundColor: '#222b3c' }}
      >
        {loading ? <Loader2 size={20} className="animate-spin" /> : <Car size={20} style={{ color: '#F4DBA7' }} />}
        {loading ? 'Submitting...' : 'Submit for Review'}
      </button>
    </form>
  )
}
