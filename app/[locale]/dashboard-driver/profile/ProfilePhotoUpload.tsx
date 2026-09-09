'use client'

import { useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface Props {
  currentImage: string | null
  driverName: string
}

export default function ProfilePhotoUpload({ currentImage, driverName }: Props) {
  const [image, setImage] = useState(currentImage)
  const [uploading, setUploading] = useState(false)

  const initials = driverName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        const formData = new FormData()
        formData.append('file', base64)
        formData.append('upload_preset', 'ml_default')

        const res = await fetch('https://api.cloudinary.com/v1_1/dcu36bfyt/image/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (data.secure_url) {
          // Save to DB
          await fetch('/api/driver/profile/photo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: data.secure_url }),
          })
          setImage(data.secure_url)
        }
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setUploading(false)
      alert('Upload failed. Try again.')
    }
  }

  return (
    <div className="relative">
      <label className="cursor-pointer block">
        {image ? (
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white relative">
            <Image src={image} alt="Profile" fill className="object-cover" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold" style={{ backgroundColor: '#F4DBA7', color: '#222b3c' }}>
            {uploading ? <Loader2 size={20} className="animate-spin" /> : initials}
          </div>
        )}
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md">
          <Camera size={12} style={{ color: '#222b3c' }} />
        </div>
        <input type="file" accept="image/*" capture="user" onChange={handleUpload} className="hidden" />
      </label>
    </div>
  )
}
