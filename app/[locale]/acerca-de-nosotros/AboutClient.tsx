"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { Target, Eye, Users, ShieldCheck, Clock } from 'lucide-react';

export default function AboutClient() {
    const t = useTranslations('AboutPage');

    const stats = [
        { 
            label: t('labelSatisfaction'),
            value: t('statSatisfaction'),
            Icon: Users 
        },
        { 
            label: t('labelReliability'),
            value: t('statReliability'),
            Icon: ShieldCheck 
        },
        { 
            label: t('labelOnTime'),
            value: t('statOnTime'),
            Icon: Clock
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-montserrat">
            <div className="relative bg-[#1a1f2e] text-white pt-24 pb-32 px-4 overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gmc-dorado-principal/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none"></div>
                <div className="relative z-10 max-w-7xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-bold font-garamond mb-6 text-white tracking-tight">
                        {t('title')}
                    </h1>
                    <p className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed font-light">
                        {t('subtitle')}
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 -mt-16 relative z-20 mb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                            <Target size={32} />
                        </div>
                        <h2 className="text-2xl font-bold font-garamond mb-4 text-gray-800">{t('mission')}</h2>
                        <p className="text-gray-500 leading-relaxed">{t('missionText')}</p>
                    </div>

                    <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-yellow-50 text-yellow-600 rounded-2xl flex items-center justify-center mb-6">
                            <Eye size={32} />
                        </div>
                        <h2 className="text-2xl font-bold font-garamond mb-4 text-gray-800">{t('vision')}</h2>
                        <p className="text-gray-500 leading-relaxed">{t('visionText')}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {stats.map((stat, i) => (
                        <div key={i} className="text-center group">
                            <div className="flex justify-center mb-4 text-gmc-dorado-principal group-hover:scale-110 transition-transform">
                                <stat.Icon size={40} />
                            </div>
                            <div className="text-4xl font-bold text-gray-900 mb-2">{stat.value}</div>
                            <div className="text-gray-500 font-medium uppercase tracking-widest text-xs">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}