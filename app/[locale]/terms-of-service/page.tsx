import React from 'react';
import { ScrollText, ShieldCheck, AlertTriangle, Scale, Clock, Truck, CreditCard, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const metadata = {
  title: 'Terms of Service | GaspMakerCargo',
  description: 'Legal terms and conditions for using GaspMakerCargo services.',
};

export default function TermsOfServicePage() {
  const t = useTranslations('TermsOfService');

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* HEADER HERO */}
      <div className="bg-gmc-gris-oscuro text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-4">
                <div className="bg-white/10 p-4 rounded-full backdrop-blur-sm">
                    <ScrollText size={48} className="text-gmc-dorado-principal" />
                </div>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold font-garamond mb-4">{t('title')}</h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                {t('subtitle')}
            </p>
            <p className="mt-6 text-xs text-gray-500 uppercase tracking-widest font-bold">
                {t('lastUpdated')}
            </p>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-4xl mx-auto px-4 py-12 -mt-8">
        
        {/* Intro Card */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <ShieldCheck className="text-green-600" /> {t('s1_title')}
            </h2>
            <p className="text-gray-600 leading-relaxed">
                {t('s1_text')}
            </p>
        </div>

        {/* Sections Grid */}
        <div className="grid gap-6">

            {/* SERVICE DESCRIPTION */}
            <Section 
                icon={<Truck size={24} className="text-blue-600"/>}
                title={t('s2_title')}
            >
                <p>{t('s2_intro')}</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
                    <li>{t('s2_li1')}</li>
                    <li>{t('s2_li2')}</li>
                    <li>{t('s2_li3')}</li>
                    <li>{t('s2_li4')}</li>
                </ul>
                <p className="mt-3 text-sm italic text-gray-500">
                    {t('s2_disclaimer')}
                </p>
            </Section>

            {/* STORAGE POLICY */}
            <Section 
                icon={<Clock size={24} className="text-orange-600"/>}
                title={t('s3_title')}
            >
                <p className="mb-3">{t('s3_intro')}</p>
                <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500 text-sm text-gray-700">
                    <strong>{t('s3_free_label')}</strong> {t('s3_free_text')}
                </div>
                <ul className="list-disc pl-5 mt-3 space-y-2 text-gray-600">
                    <li>
                        <strong>{t('s3_fee_label')}</strong> {t('s3_fee_text')}
                    </li>
                    <li>
                        <strong>{t('s3_abandon_label')}</strong> {t('s3_abandon_text')}
                    </li>
                </ul>
            </Section>

            {/* PAYMENTS */}
            <Section 
                icon={<CreditCard size={24} className="text-purple-600"/>}
                title={t('s4_title')}
            >
                <p>{t('s4_intro')}</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
                    <li><strong>{t('s4_curr_label')}</strong> {t('s4_curr_text')}</li>
                    <li><strong>{t('s4_vol_label')}</strong> {t('s4_vol_text')}</li>
                    <li><strong>{t('s4_ref_label')}</strong> {t('s4_ref_text')}</li>
                </ul>
            </Section>

            {/* PROHIBITED ITEMS */}
            <Section 
                icon={<AlertTriangle size={24} className="text-red-600"/>}
                title={t('s5_title')}
            >
                <p>{t('s5_intro')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-sm text-gray-600">
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div> {t('s5_li1')}</span>
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div> {t('s5_li2')}</span>
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div> {t('s5_li3')}</span>
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div> {t('s5_li4')}</span>
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div> {t('s5_li5')}</span>
                </div>
                <p className="mt-3 text-red-600 text-xs font-bold">
                    {t('s5_warning')}
                </p>
            </Section>

            {/* LIABILITY */}
            <Section 
                icon={<Scale size={24} className="text-gray-600"/>}
                title={t('s6_title')}
            >
                <p>{t('s6_intro')}</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
                    <li>{t('s6_li1')}</li>
                    <li>{t('s6_li2')}</li>
                    <li>{t('s6_li3')}</li>
                </ul>
                <p className="mt-2">
                    {t('s6_limit')}
                </p>
            </Section>

             {/* CONTACT */}
             <Section 
                icon={<Mail size={24} className="text-teal-600"/>}
                title={t('s7_title')}
            >
                <p>{t('s7_intro')}</p>
                <div className="mt-4 bg-gray-50 p-4 rounded-lg flex flex-col gap-2">
                    <p className="text-sm font-bold text-gray-800">GaspMakerCargo LLC</p>
                    <p className="text-sm text-gray-600">Miami, Florida, USA</p>
                    <a href="mailto:support@gaspmakercargo.com" className="text-blue-600 hover:underline text-sm font-medium">
                        support@gaspmakercargo.com
                    </a>
                </div>
            </Section>

        </div>
      </div>

    </div>
  );
}

// --- Helper Component para Secciones ---
function Section({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) {
    return (
        <section className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <div className="bg-gray-50 p-2 rounded-lg">{icon}</div>
                {title}
            </h3>
            <div className="text-gray-600 leading-relaxed text-sm md:text-base">
                {children}
            </div>
        </section>
    );
}