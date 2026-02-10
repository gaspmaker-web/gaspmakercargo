"use client";
import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { 
    UserPlus, ShoppingCart, FileText, Plane, 
    ArrowRight, CheckCircle2, Rocket 
} from 'lucide-react';

export default function ComoFuncionaClient() {
    const t = useTranslations('HowItWorks');

    const steps = [
        {
            id: 1,
            icon: UserPlus,
            title: t('step1Title'),
            desc: t('step1Desc'),
            color: 'bg-blue-50 text-blue-600'
        },
        {
            id: 2,
            icon: ShoppingCart,
            title: t('step2Title'),
            desc: t('step2Desc'),
            color: 'bg-purple-50 text-purple-600'
        },
        {
            id: 3,
            icon: FileText,
            title: t('step3Title'),
            desc: t('step3Desc'),
            color: 'bg-orange-50 text-orange-600'
        },
        {
            id: 4,
            icon: Plane,
            title: t('step4Title'),
            desc: t('step4Desc'),
            color: 'bg-green-50 text-green-600'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-montserrat">
            
            {/* HERO SECTION */}
            <div className="relative bg-[#1a1f2e] text-white pt-24 pb-32 px-4 overflow-hidden">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gmc-dorado-principal/10 rounded-full blur-[100px] -ml-40 -mt-40 pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] -mr-40 -mb-20 pointer-events-none"></div>
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

                <div className="relative z-10 max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
                        <Rocket size={12} className="text-gmc-dorado-principal" />
                        <span className="text-xs font-bold tracking-wider text-gray-200 uppercase">
                            {t('badge')}
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold font-garamond mb-6 text-white tracking-tight">
                        {t('title')}
                    </h1>
                    <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light">
                        {t('subtitle')}
                    </p>
                </div>
            </div>

            {/* STEPS SECTION */}
            <div className="max-w-7xl mx-auto px-4 -mt-20 relative z-20 mb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
                    <div className="hidden lg:block absolute top-12 left-0 w-full h-0.5 bg-gray-200 -z-10 transform translate-y-4"></div>

                    {steps.map((step) => (
                        <div key={step.id} className="relative group">
                            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full flex flex-col items-center text-center z-10 hover:-translate-y-2">
                                <div className="absolute -top-4 bg-gray-900 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md border-2 border-white group-hover:bg-gmc-dorado-principal group-hover:text-black transition-colors">
                                    {step.id}
                                </div>
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${step.color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                                    <step.icon size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-3 font-garamond group-hover:text-gmc-dorado-principal transition-colors">
                                    {step.title}
                                </h3>
                                <p className="text-gray-500 text-sm leading-relaxed">
                                    {step.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* BENEFICIOS */}
            <div className="bg-white py-20 px-4 border-t border-gray-100">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-800 font-garamond mb-6">
                                {t('whyChooseUs')}
                            </h2>
                            <div className="space-y-4">
                                {[1, 2, 3].map((num) => (
                                    <div key={num} className="flex gap-4 group">
                                        <div className="mt-1 bg-green-100 text-green-600 w-8 h-8 rounded-full flex items-center justify-center shrink-0 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                            <CheckCircle2 size={16} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800">{t(`benefit${num}Title`)}</h4>
                                            <p className="text-sm text-gray-500">{t(`benefit${num}Desc`)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* CTA CARD */}
                        <div className="bg-gray-900 rounded-3xl p-10 border border-gray-800 text-center shadow-2xl relative overflow-hidden text-white group">
                            <div className="absolute inset-0 bg-gmc-dorado-principal/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold font-garamond mb-4 text-white">
                                    {t('ctaTitle')}
                                </h3 >
                                <p className="text-gray-400 mb-8 text-sm max-w-sm mx-auto">
                                    {t('ctaFinalText')}
                                </p>
                                
                                {/* 👇 ENLACE CORREGIDO: AHORA LLEVA A /registro-cliente */}
                                <Link 
                                    href="/registro-cliente" 
                                    className="inline-flex items-center gap-2 px-8 py-3 bg-gmc-dorado-principal text-black font-bold rounded-xl hover:bg-yellow-400 transition-all transform hover:scale-105 shadow-lg w-full justify-center sm:w-auto"
                                >
                                    {t('ctaBtn')} <ArrowRight size={18}/>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}