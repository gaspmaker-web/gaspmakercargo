import { Truck, DollarSign, Clock, MapPin, Shield, Star } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import BecomeDriverForm from './BecomeDriverForm'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  interactiveWidget: 'resizes-content',
}

export default async function BecomeDriverPage(props: any) {
  const params = await props.params
  const t = await getTranslations({ locale: params.locale, namespace: 'BecomeDriver' })

  const BENEFITS = [
    { icon: DollarSign, title: t('benefit_pay_title'), desc: t('benefit_pay_desc') },
    { icon: Clock, title: t('benefit_hours_title'), desc: t('benefit_hours_desc') },
    { icon: MapPin, title: t('benefit_routes_title'), desc: t('benefit_routes_desc') },
    { icon: Shield, title: t('benefit_support_title'), desc: t('benefit_support_desc') },
  ]

  const REQUIREMENTS = [
    'Valid driver\'s license',
    'Personal auto insurance',
    'Smartphone (Android or iPhone)',
    'Clean driving record',
    'Must be 21 years or older',
  ]

  const STEPS = [
    { step: '01', title: t('step1_title'), desc: t('step1_desc') },
    { step: '02', title: t('step2_title'), desc: t('step2_desc') },
    { step: '03', title: t('step3_title'), desc: t('step3_desc') },
    { step: '04', title: t('step4_title'), desc: t('step4_desc') },
  ]

  return (
    <div className="min-h-screen bg-gray-50 font-sans overflow-x-hidden">
      {/* Hero */}
      <div className="bg-[#222b3c] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm font-medium mb-6" style={{ color: '#F4DBA7' }}>
            <Truck size={16} />
            {t('hero_badge')}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold font-garamond mb-4">
           {t('hero_title')}
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            {t('hero_desc')}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Benefits */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10 font-garamond">{t('benefits_title')}</h2>
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
          <h2 className="text-xl font-bold text-gray-900 mb-6 font-garamond">{t('requirements_title')}</h2>
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
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10 font-garamond">{t('how_title')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {STEPS.map(({ step, title, desc }) => (
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2 font-garamond">{t('form_title')}</h2>
          <p className="text-sm text-gray-500 mb-8">{t('form_desc')}</p>
          <BecomeDriverForm locale={params.locale} />
        </div>
      </div>
    </div>
  )
}
