import React from 'react';
import Link from 'next/link';
import { Mail, ShieldCheck, CreditCard, FileText, CheckCircle, Building2, ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

// Metadata dinámica
export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'MailboxPublic' });
  return {
    title: t('metadataTitle'),
    description: t('metadataDesc'),
  };
}

export default async function MailboxLandingPage({ params: { locale } }: { params: { locale: string } }) {
  
  // 🔥 Activamos el hook de traducciones para Server Components
  const t = await getTranslations({ locale, namespace: 'MailboxPublic' });

  return (
    <div className="min-h-screen bg-gray-50 font-montserrat selection:bg-gmc-dorado-principal selection:text-black">
      
     {/* ================= HERO SECTION ================= */}
      <section className="bg-[#1a1f2e] text-white pt-24 pb-32 px-6 relative overflow-hidden">
        
        {/* 🔥 Efectos de fondo idénticos a la web principal (Diseño Prime) 🔥 */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gmc-dorado-principal/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] -ml-40 -mb-20 pointer-events-none"></div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-gmc-dorado-principal text-sm font-bold mb-6">
            <Mail size={16} /> {t('heroBadge')}
          </div>
          <h1 className="text-4xl md:text-6xl font-black font-garamond mb-6 leading-tight">
            {t('heroTitle1')} <br className="hidden md:block"/>
            <span className="text-gmc-dorado-principal">{t('heroTitle2')}</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('heroSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href={`/${locale}/registro-cliente`} className="bg-gmc-dorado-principal text-black px-8 py-4 rounded-xl font-bold text-lg hover:bg-white transition-all shadow-[0_0_20px_rgba(234,216,177,0.3)] flex items-center gap-2">
              {t('btnOpen')} <ArrowRight size={20} />
            </Link>
            <a href="#planes" className="text-white hover:text-gmc-dorado-principal px-8 py-4 font-bold transition-colors">
              {t('btnPlans')}
            </a>
          </div>
        </div>
      </section>

      {/* ================= BENEFICIOS ================= */}
      <section className="py-20 px-6 max-w-7xl mx-auto -mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center transform hover:-translate-y-1 transition-transform">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CreditCard size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">{t('card1Title')}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{t('card1Desc')}</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center transform hover:-translate-y-1 transition-transform">
            <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">{t('card2Title')}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{t('card2Desc')}</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center transform hover:-translate-y-1 transition-transform">
            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Building2 size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">{t('card3Title')}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{t('card3Desc')}</p>
          </div>
        </div>
      </section>

      {/* ================= PLANES DE PRECIOS ================= */}
      <section id="planes" className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-gray-800 mb-4">{t('plansTitle')}</h2>
          <p className="text-gray-500">{t('plansSubtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Plan Básico */}
          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm hover:shadow-xl transition-shadow flex flex-col">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{t('planBasicName')}</h3>
            <p className="text-sm text-gray-500 mb-6 h-10">{t('planBasicDesc')}</p>
            <div className="mb-6">
              <span className="text-5xl font-black text-gray-900">$7.99</span>
              <span className="text-gray-500 font-bold">/mes</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3 text-sm text-gray-700"><CheckCircle size={18} className="text-green-500 shrink-0"/> <span>{t('basicFeature1')}</span></li>
              <li className="flex items-start gap-3 text-sm text-gray-700"><CheckCircle size={18} className="text-green-500 shrink-0"/> <span>{t('basicFeature2')}</span></li>
              <li className="flex items-start gap-3 text-sm text-gray-700"><CheckCircle size={18} className="text-green-500 shrink-0"/> <span>{t('basicFeature3')}</span></li>
              <li className="flex items-start gap-3 text-sm text-gray-700"><CheckCircle size={18} className="text-gray-300 shrink-0"/> <span>{t('basicFeature4')}</span></li>
              <li className="flex items-start gap-3 text-sm text-gray-700"><CheckCircle size={18} className="text-gray-300 shrink-0"/> <span>{t('basicFeature5')}</span></li>
              <li className="flex items-start gap-3 text-sm text-gray-700"><CheckCircle size={18} className="text-green-500 shrink-0"/> <span>{t('basicFeature6')}</span></li>
            </ul>
            <Link href={`/${locale}/registro-cliente?plan=basico`} className="w-full block text-center py-4 rounded-xl border-2 border-gmc-gris-oscuro text-gmc-gris-oscuro font-bold hover:bg-gmc-gris-oscuro hover:text-white transition-colors">
              {t('btnBasic')}
            </Link>
          </div>

          {/* Plan Premium */}
          <div className="bg-gmc-gris-oscuro rounded-3xl p-8 border-2 border-gmc-dorado-principal shadow-2xl flex flex-col relative transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gmc-dorado-principal text-black px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
              {t('planPremiumBadge')}
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{t('planPremiumName')}</h3>
            <p className="text-sm text-gray-400 mb-6 h-10">{t('planPremiumDesc')}</p>
            <div className="mb-6">
              <span className="text-5xl font-black text-gmc-dorado-principal">$14.99</span>
              <span className="text-gray-400 font-bold">/mes</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3 text-sm text-gray-200"><CheckCircle size={18} className="text-gmc-dorado-principal shrink-0"/> <span>{t('premiumFeature1')}</span></li>
              <li className="flex items-start gap-3 text-sm text-gray-200"><CheckCircle size={18} className="text-gmc-dorado-principal shrink-0"/> <span>{t('premiumFeature2')}</span></li>
              <li className="flex items-start gap-3 text-sm text-gray-200"><CheckCircle size={18} className="text-gmc-dorado-principal shrink-0"/> <span>{t('premiumFeature3')}</span></li>
              <li className="flex items-start gap-3 text-sm text-gray-200"><CheckCircle size={18} className="text-gmc-dorado-principal shrink-0"/> <span>{t('premiumFeature4')}</span></li>
              <li className="flex items-start gap-3 text-sm text-gray-200"><CheckCircle size={18} className="text-gmc-dorado-principal shrink-0"/> <span>{t('premiumFeature5')}</span></li>
              <li className="flex items-start gap-3 text-sm text-gray-200"><CheckCircle size={18} className="text-gmc-dorado-principal shrink-0"/> <span>{t('premiumFeature6')}</span></li>
            </ul>
            <Link href={`/${locale}/registro-cliente?plan=premium`} className="w-full block text-center py-4 rounded-xl bg-gmc-dorado-principal text-black font-bold shadow-lg hover:brightness-110 transition-all">
              {t('btnPremium')}
            </Link>
          </div>

        </div>
      </section>

      {/* ================= CÓMO FUNCIONA / LEGAL (FORM 1583) ================= */}
      <section className="bg-white py-20 px-6 border-t border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <FileText size={48} className="mx-auto text-blue-500 mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('footerTitle')}</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            {t('footerDesc')}
          </p>
        </div>
      </section>

    </div>
  );
}