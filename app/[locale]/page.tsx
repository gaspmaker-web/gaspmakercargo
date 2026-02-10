"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { 
  ArrowRight, ShieldCheck, Globe, Zap, 
  Package, ShoppingCart, FileText, Plane, Layers,
  CheckCircle, Box
} from 'lucide-react';

export default function HomePage() {
  const t = useTranslations('HomePage');
  const tSteps = useTranslations('HowItWorks'); // Usa las traducciones de la guía
  const tNav = useTranslations('Navigation');

  // Definimos los 6 pasos visualmente
  const steps = [
    { id: 1, icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 2, icon: ShoppingCart, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 3, icon: FileText, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 4, icon: ShieldCheck, color: 'text-green-500', bg: 'bg-green-50' },
    { id: 5, icon: Layers, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { id: 6, icon: Plane, color: 'text-blue-600', bg: 'bg-blue-100' },
  ];

  return (
    <div className="min-h-screen bg-white font-montserrat overflow-x-hidden">
      
      {/* --- 1. SECCIÓN HERO --- */}
      <section className="relative bg-[#1a1f2e] pt-20 pb-32 md:pt-32 md:pb-48 px-4 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gmc-dorado-principal/10 rounded-full blur-[120px] -mr-40 -mt-40 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -ml-40 -mb-20 pointer-events-none"></div>
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
                <ShieldCheck size={16} className="text-gmc-dorado-principal" />
                <span className="text-xs font-bold tracking-[2px] text-gray-200 uppercase">
                  {t('Hero.badge')}
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold font-garamond text-white leading-[1.1] mb-6">
                {t('Hero.title_part1')} <br />
                <span className="text-gmc-dorado-principal">{t('Hero.title_part2')}</span>
              </h1>
              <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light">
                {t('Hero.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/registro-cliente" className="px-8 py-4 bg-gmc-dorado-principal text-black font-bold rounded-xl hover:bg-yellow-400 transition-all transform hover:scale-105 shadow-2xl flex items-center justify-center gap-2">
                  {t('Hero.cta_primary')} <ArrowRight size={20}/>
                </Link>
                <Link href="/calculadora-costos" className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-all backdrop-blur-sm flex items-center justify-center gap-2">
                  {t('Hero.cta_secondary')}
                </Link>
              </div>
            </div>
            <div className="hidden lg:block relative h-[500px]">
                <div className="absolute inset-0 bg-gradient-to-tr from-gmc-dorado-principal/20 to-transparent rounded-3xl overflow-hidden shadow-2xl border border-white/5">
                    <Image src="/gaspmakercargoproject.png" alt="Enterprise Logistics" fill className="object-contain p-12 opacity-80" />
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 2. PASOS DINÁMICOS (6 PASOS) --- */}
      <section id="como-funciona" className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-garamond text-gray-900 mb-4">
              {tSteps('title')}
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg font-light">
              {tSteps('subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.id} className="group relative bg-gray-50 p-8 rounded-[32px] border border-gray-100 hover:bg-white hover:shadow-2xl transition-all duration-500">
                <div className="flex justify-between items-start mb-6">
                    <div className={`w-14 h-14 ${step.bg} ${step.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <step.icon size={28} />
                    </div>
                    <span className="text-4xl font-black text-gray-200 group-hover:text-gmc-dorado-principal/20 transition-colors">0{step.id}</span>
                </div>
                {/* 🔥 CORRECCIÓN CLAVE: 
                   Usa tSteps('step1Title'), tSteps('step2Title'), etc.
                   Esto coincide con la estructura plana de los JSON actuales.
                */}
                <h3 className="text-xl font-bold text-gray-800 mb-3 font-garamond">
                  {tSteps(`step${step.id}Title`)}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {tSteps(`step${step.id}Desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- 3. SECCIÓN DE DESTINOS --- */}
      <section className="py-24 bg-gray-50 px-4 overflow-hidden">
        <div className="container mx-auto max-w-7xl flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 space-y-8 relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold font-garamond text-gray-900 leading-tight">
              {t('Destinations.title_part1')} <br />
              <span className="text-gmc-dorado-principal">{t('Destinations.title_part2')}</span>
            </h2>
            <p className="text-gray-600 leading-relaxed text-lg font-light">
              {t('Destinations.description')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <CheckCircle className="text-green-500 shrink-0" size={20} /> 
                <span className="text-sm font-bold text-gray-700">{t('Destinations.feature1')}</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <CheckCircle className="text-green-500 shrink-0" size={20} /> 
                <span className="text-sm font-bold text-gray-700">{t('Destinations.feature2')}</span>
              </div>
            </div>
            <Link href="/ubicaciones" className="inline-flex items-center gap-2 text-gmc-dorado-principal font-bold group text-lg">
                {t('Destinations.link')} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="lg:w-1/2 relative flex items-center justify-center perspective-1000">
            <div className="absolute w-[120%] h-[120%] bg-gradient-radial from-blue-500/10 via-blue-500/5 to-transparent rounded-full blur-[80px]"></div>
            <div className="relative w-full max-w-[500px] aspect-square bg-white/70 backdrop-blur-2xl rounded-[60px] shadow-[0_30px_90px_rgba(59,130,246,0.15)] border border-white/60 flex items-center justify-center overflow-hidden group">
                <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-[70%] h-[70%] animate-[spin_60s_linear_infinite]" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <radialGradient id="globeBlue" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.1" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                        </radialGradient>
                      </defs>
                      <circle cx="200" cy="200" r="190" fill="url(#globeBlue)" stroke="#3b82f6" strokeWidth="0.5" strokeOpacity="0.2" />
                      <ellipse cx="200" cy="200" rx="190" ry="190" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.1" fill="none" />
                      <ellipse cx="200" cy="200" rx="90" ry="190" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.1" fill="none" />
                      <path d="M10,200 H390" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.1" />
                      <path d="M60,100 Q200,180 340,100" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.1" fill="none" />
                      <path d="M60,300 Q200,220 340,300" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.1" fill="none" />
                    </svg>
                </div>
                <div className="absolute inset-0 animate-[spin_8s_linear_infinite]">
                    <div className="absolute top-1/2 right-[15%] -translate-y-1/2 flex items-center justify-center">
                        <div className="transform rotate-90 relative">
                             <div className="absolute top-full left-1/2 -translate-x-1/2 w-1 h-32 bg-gradient-to-b from-gmc-dorado-principal to-transparent opacity-60 blur-[1px]"></div>
                             <Plane size={48} className="text-gmc-dorado-principal fill-gmc-dorado-principal filter drop-shadow-[0_0_8px_rgba(234,179,8,0.6)] relative z-10" strokeWidth={1.5} />
                        </div>
                    </div>
                </div>
                <div className="absolute inset-[15%] border border-dashed border-gmc-dorado-principal/30 rounded-full pointer-events-none"></div>
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-[#111827] text-white px-8 py-3 rounded-full shadow-xl border border-white/10 group-hover:scale-105 transition-transform duration-300">
                    <Globe size={16} className="text-gmc-dorado-principal animate-pulse" />
                    <span className="text-xs font-bold tracking-[2px] uppercase whitespace-nowrap">GASP MAKER CARGO</span>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 4. CTA & NAVEGACIÓN --- */}
      <section className="py-20 bg-white border-t border-gray-100 text-center">
        <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold font-garamond text-gray-900 mb-10">
                {t('Footer.cta_title')}
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 text-[11px] font-black text-gray-400 tracking-[3px] uppercase">
                <Link href="/servicios" className="hover:text-gmc-dorado-principal transition-colors">{tNav('services')}</Link>
                <span className="hidden md:block h-5 w-[1px] bg-gray-300"></span>
                <Link href="/acerca-de-nosotros" className="hover:text-gmc-dorado-principal transition-colors">{tNav('aboutUs')}</Link>
                <span className="hidden md:block h-5 w-[1px] bg-gray-300"></span>
                <Link href="/testimonios" className="hover:text-gmc-dorado-principal transition-colors">{tNav('testimonials')}</Link>
            </div>
        </div>
      </section>
    </div>
  );
}
