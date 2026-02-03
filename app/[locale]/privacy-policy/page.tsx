import React from 'react';
import { Lock, Eye, Database, Globe, Shield, Mail, FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const metadata = {
  title: 'Privacy Policy | GaspMakerCargo',
  description: 'How we collect, use, and protect your personal data.',
};

export default function PrivacyPolicyPage() {
  const t = useTranslations('PrivacyPolicy');

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* HERO SECTION */}
      <div className="bg-gmc-gris-oscuro text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-4">
                <div className="bg-white/10 p-4 rounded-full backdrop-blur-sm">
                    <Lock size={48} className="text-green-400" />
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

      {/* MAIN CONTENT */}
      <div className="max-w-4xl mx-auto px-4 py-12 -mt-8">
        
        {/* Intro */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Shield className="text-blue-600" /> {t('intro_title')}
            </h2>
            <p className="text-gray-600 leading-relaxed">
                {t('intro_text')}
            </p>
        </div>

        {/* Sections Grid */}
        <div className="grid gap-6">

            {/* 1. DATA WE COLLECT */}
            <Section 
                icon={<Database size={24} className="text-indigo-600"/>}
                title={t('s1_title')}
            >
                <p>{t('s1_text')}</p>
                <ul className="list-disc pl-5 mt-3 space-y-2 text-gray-600 text-sm">
                    <li><strong>{t('s1_li1_label')}</strong> {t('s1_li1_text')}</li>
                    <li><strong>{t('s1_li2_label')}</strong> {t('s1_li2_text')}</li>
                    <li><strong>{t('s1_li3_label')}</strong> {t('s1_li3_text')}</li>
                </ul>
            </Section>

            {/* 2. HOW WE USE DATA */}
            <Section 
                icon={<Eye size={24} className="text-teal-600"/>}
                title={t('s2_title')}
            >
                <p>{t('s2_text')}</p>
                <ul className="list-disc pl-5 mt-3 space-y-2 text-gray-600 text-sm">
                    <li>{t('s2_li1')}</li>
                    <li>{t('s2_li2')}</li>
                    <li>{t('s2_li3')}</li>
                    <li>{t('s2_li4')}</li>
                </ul>
            </Section>

            {/* 3. COOKIES */}
            <Section 
                icon={<Globe size={24} className="text-orange-600"/>}
                title={t('s3_title')}
            >
                <p>{t('s3_text')}</p>
                <div className="mt-3 bg-orange-50 p-3 rounded text-xs text-orange-800 border border-orange-100">
                    <strong>{t('s3_essential_label')}</strong> {t('s3_essential_text')}
                </div>
            </Section>

            {/* 4. THIRD PARTIES */}
            <Section 
                icon={<FileText size={24} className="text-purple-600"/>}
                title={t('s4_title')}
            >
                <p>{t('s4_text')}</p>
                <ul className="list-disc pl-5 mt-3 space-y-2 text-gray-600 text-sm">
                    <li><strong>{t('s4_li1_label')}</strong> {t('s4_li1_text')}</li>
                    <li><strong>{t('s4_li2_label')}</strong> {t('s4_li2_text')}</li>
                    <li><strong>{t('s4_li3_label')}</strong> {t('s4_li3_text')}</li>
                </ul>
            </Section>

             {/* CONTACT */}
             <Section 
                icon={<Mail size={24} className="text-gray-600"/>}
                title={t('s5_title')}
            >
                <p>{t('s5_text')}</p>
                <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                    <a href="mailto:privacy@gaspmakercargo.com" className="text-blue-600 hover:underline font-bold">
                        privacy@gaspmakercargo.com
                    </a>
                    <p className="text-xs text-gray-500 mt-1">GaspMakerCargo LLC, Miami, FL.</p>
                </div>
            </Section>

        </div>
      </div>
    </div>
  );
}

// Helper Component
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