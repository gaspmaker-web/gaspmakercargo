import { Metadata } from 'next'
import BecomeDriverForm from './BecomeDriverForm'
import { Truck, DollarSign, Clock, MapPin, Shield, Star } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Become a Driver | Gasp Maker',
  description: 'Join the Gasp Maker driver network. Deliver packages in Miami and the Caribbean. Flexible hours, competitive pay.',
}

const BENEFITS = [
  { icon: DollarSign, title: 'Competitive Pay', desc: 'Earn per delivery. Get paid directly to your bank account.' },
  { icon: Clock, title: 'Flexible Hours', desc: 'Work when you want. Go online and offline with one tap.' },
  { icon: MapPin, title: 'Local Routes', desc: 'Deliver in your city. Miami, Barbados, Trinidad & Jamaica.' },
  { icon: Shield, title: 'Fully Supported', desc: 'Our dispatch team supports you every step of the way.' },
]

const REQUIREMENTS = [
  'Valid driver\'s license',
  'Personal auto insurance',
  'Smartphone (Android or iPhone)',
  'Clean driving record',
  'Must be 21 years or older',
]

export default function BecomeDriverPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Hero */}
      <div className="bg-[#222b3c] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm font-medium mb-6" style={{ color: '#F4DBA7' }}>
            <Truck size={16} />
            Now Hiring Drivers
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-garamond mb-4">
            Drive with Gasp Maker
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Join our professional driver network and earn money on your own schedule. Deliver packages across Miami and the Caribbean.
          </p>
        </div>
      </div>

      {/* Benefits */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10 font-garamond">Why drive with us?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
          {BENEFITS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F4DBA7' }}>
                <Icon size={22} style={{ color: '#222b3c' }} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Requirements */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-16">
          <h2 className="text-xl font-bold text-gray-900 mb-6 font-garamond">Requirements</h2>
          <div className="space-y-3">
            {REQUIREMENTS.map(req => (
              <div key={req} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Star size={10} className="text-green-600" />
                </div>
                <p className="text-sm text-gray-700">{req}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10 font-garamond">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Apply', desc: 'Fill out the form below with your information.' },
              { step: '02', title: 'Review', desc: 'Our team reviews your application within 24-48 hours.' },
              { step: '03', title: 'Onboard', desc: 'You receive your credentials and download the app.' },
              { step: '04', title: 'Drive', desc: 'Go online and start receiving delivery opportunities.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold" style={{ backgroundColor: '#222b3c', color: '#F4DBA7' }}>
                  {step}
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Application Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 font-garamond">Apply Now</h2>
          <p className="text-sm text-gray-500 mb-8">Fill out the form below and our team will contact you within 24-48 hours.</p>
          <BecomeDriverForm />
        </div>
      </div>
    </div>
  )
}
