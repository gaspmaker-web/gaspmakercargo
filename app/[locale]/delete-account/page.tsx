import { Trash2, Mail, Clock, Shield } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export const metadata = {
  title: 'Delete Account | Gasp Maker',
  description: 'Request deletion of your Gasp Maker account and associated data.',
}

export default async function DeleteAccountPage(props: any) {
  const params = await props.params
  const t = await getTranslations({ locale: params.locale, namespace: 'DeleteAccount' })

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="bg-[#222b3c] text-white px-5 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Trash2 size={28} className="text-red-400" />
          </div>
          <h1 className="text-3xl font-bold font-garamond mb-3">{t('title')}</h1>
          <p className="text-gray-300 text-sm">{t('desc')}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{t('how_title')}</h2>
          <div className="space-y-4">
            {[
              { step: '1', title: t('step1_title'), desc: t('step1_desc') },
              { step: '2', title: t('step2_title'), desc: t('step2_desc') },
              { step: '3', title: t('step3_title'), desc: t('step3_desc') },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#222b3c] flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ color: '#F4DBA7' }}>{step}</div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <a href="mailto:support@gaspmakercargo.com?subject=Account%20Deletion%20Request"
            className="mt-6 w-full py-3 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2"
            style={{ backgroundColor: '#222b3c' }}>
            <Mail size={16} />
            {t('send_btn')}
          </a>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{t('deleted_title')}</h2>
          <div className="space-y-2">
            {['deleted_1','deleted_2','deleted_3','deleted_4','deleted_5','deleted_6'].map(key => (
              <div key={key} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Trash2 size={8} className="text-red-500" />
                </div>
                <p className="text-sm text-gray-600">{t(key as any)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{t('retained_title')}</h2>
          <div className="space-y-2">
            {['retained_1','retained_2','retained_3'].map(key => (
              <div key={key} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <Clock size={8} className="text-yellow-600" />
                </div>
                <p className="text-sm text-gray-600">{t(key as any)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 flex items-center gap-3">
          <Shield size={20} className="text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            {t('privacy_note')}{' '}
            <Link href={`/${params.locale}/privacy-policy`} className="font-bold underline">{t('privacy_link')}</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
