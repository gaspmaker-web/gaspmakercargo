"use client";

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { Package, Globe, Smartphone, Mail, Truck, ShoppingBag, Check } from 'lucide-react';

export default function CargoOSLandingPage() {
  const t = useTranslations('CargoOSPage');

  const features = [
    { icon: Globe, title: t('feature1_title'), desc: t('feature1_desc') },
    { icon: Package, title: t('feature2_title'), desc: t('feature2_desc') },
    { icon: Smartphone, title: t('feature3_title'), desc: t('feature3_desc') },
    { icon: Mail, title: t('feature4_title'), desc: t('feature4_desc') },
    { icon: Truck, title: t('feature5_title'), desc: t('feature5_desc') },
    { icon: ShoppingBag, title: t('feature6_title'), desc: t('feature6_desc') },
  ];

  const plans = [
    { name: t('plan_starter'), price: '$149', desc: t('plan_starter_desc'), features: ['1 warehouse', 'Up to 50 clients', 'All carriers', 'Client portal'] },
    { name: t('plan_growth'), price: '$299', desc: t('plan_growth_desc'), features: ['1 warehouse', 'Unlimited clients', 'Local delivery', 'Priority support'], highlight: true },
    { name: t('plan_pro'), price: '$499', desc: t('plan_pro_desc'), features: ['2 warehouses', 'Multiple admins', 'Live driver tracking', 'Custom integrations'] },
  ];

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Package size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl text-black">CargoOS</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#pricing" className="text-gray-600 hover:text-black text-sm font-medium">
              {t('hero_cta2')}
            </a>
            <a href="#contact" className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition">
              {t('hero_cta')}
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-6 text-center bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-black text-white px-4 py-1.5 rounded-full text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
            White Label SaaS Platform
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-black mb-6 leading-tight">
            {t('hero_title')}
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('hero_subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#contact" className="bg-black text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-800 transition">
              {t('hero_cta')} →
            </a>
            <a href="#pricing" className="border border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-gray-400 transition">
              {t('hero_cta2')}
            </a>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-black mb-4">
            {t('features_title')}
          </h2>
          <p className="text-center text-gray-500 mb-16 text-lg">Built for operators in the USA.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="p-6 border border-gray-100 rounded-2xl hover:border-gray-300 hover:shadow-sm transition">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4">
                  <f.icon size={24} className="text-black" />
                </div>
                <h3 className="font-semibold text-lg text-black mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-black mb-4">
            {t('pricing_title')}
          </h2>
          <p className="text-center text-gray-500 mb-4">{t('setup_fee')}</p>
          <p className="text-center text-gray-400 text-sm mb-16">per month · cancel anytime</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <div key={i} className={`p-8 rounded-2xl border ${plan.highlight ? 'bg-black text-white border-black' : 'bg-white border-gray-200'}`}>
                <div className={`text-sm font-medium mb-2 ${plan.highlight ? 'text-gray-400' : 'text-gray-500'}`}>
                  {plan.desc}
                </div>
                <h3 className={`text-2xl font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-black'}`}>
                  {plan.name}
                </h3>
                <div className={`text-4xl font-bold mb-6 ${plan.highlight ? 'text-white' : 'text-black'}`}>
                  {plan.price}<span className={`text-base font-normal ${plan.highlight ? 'text-gray-400' : 'text-gray-500'}`}>/mo</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <Check size={16} className={plan.highlight ? 'text-green-400' : 'text-green-600'} />
                      <span className={plan.highlight ? 'text-gray-300' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <a href="#contact" className={`block text-center py-3 rounded-xl font-semibold transition ${plan.highlight ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800'}`}>
                  {t('plan_cta')}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-20 px-6 bg-black text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('contact_title')}</h2>
          <p className="text-gray-400 text-lg mb-10">{t('contact_subtitle')}</p>
          <a href="mailto:hello@cargoos.io" className="inline-block bg-white text-black px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition">
            {t('contact_cta')} →
          </a>
          <p className="text-gray-600 text-sm mt-8">hello@cargoos.io</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-6 border-t border-gray-100 text-center">
        <p className="text-gray-400 text-sm">{t('footer_tagline')} · © {new Date().getFullYear()} CargoOS</p>
      </footer>

    </div>
  );
}