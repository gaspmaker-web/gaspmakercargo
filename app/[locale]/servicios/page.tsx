"use client";

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { 
    MapPin, Layers, Truck, Building2, 
    ArrowRight, CheckCircle, ShieldCheck, Globe, Info 
} from 'lucide-react';

// 🛡️ ESCUDO NUCLEAR: Evita errores de generación estática
export const dynamic = 'force-dynamic';

export default function ServicesPage() {
    const t = useTranslations('ServicesPage');

    const services = [
        {
            id: 'locker',
            icon: MapPin,
            title: t('lockerTitle'),
            desc: t('lockerDesc'),
            color: 'bg-blue-50 text-blue-600',
            borderColor: 'group-hover:border-blue-200'
        },
        {
            id: 'consolidation',
            icon: Layers,
            title: t('consolidationTitle'),
            desc: t('consolidationDesc'),
            color: 'bg-purple-50 text-purple-600',
            borderColor: 'group-hover:border-purple-200'
        },
        {
            id: 'pickup',
            icon: Truck,
            title: t('pickupTitle'),
            desc: t('pickupDesc'),
            color: 'bg-orange-50 text-orange-600',
            borderColor: 'group-hover:border-orange-200'
        },
        {
            id: 'corporate',
            icon: Building2,
            title: t('corporateTitle'),
            desc: t('corporateDesc'),
            color: 'bg-green-50 text-green-600',
            borderColor: 'group-hover:border-green-200'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-montserrat">
            
            {/* HERO SECTION MEJORADO */}
            <div className="relative bg-[#1a1f2e] text-white pt-24 pb-32 px-4 overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gmc-dorado-principal/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] -ml-40 -mb-20 pointer-events-none"></div>
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

                <div className="relative z-10 max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
                        <Globe size={12} className="text-gmc-dorado-principal" />
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

            {/* SERVICES GRID */}
            <div className="max-w-7xl mx-auto px-4 -mt-20 relative z-20 mb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {services.map((service) => (
                        <div 
                            key={service.id} 
                            className={`
                                bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl 
                                transition-all duration-300 hover:-translate-y-2 
                                border border-gray-100 ${service.borderColor} group flex flex-col
                            `}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${service.color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                                    <service.icon size={28} />
                                </div>
                                <div className="text-gray-200 group-hover:text-gmc-dorado-principal transition-colors">
                                    <ArrowRight size={20} className="transform -rotate-45 group-hover:rotate-0 transition-transform duration-300"/>
                                </div>
                            </div>
                            
                            <h3 className="text-xl font-bold text-gray-800 mb-3 font-garamond group-hover:text-gmc-dorado-principal transition-colors">
                                {service.title}
                            </h3>
                            
                            <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-grow">
                                {service.desc}
                            </p>

                            {/* 🔥 NUEVO: ALERTA VISUAL (Solo para Consolidation) */}
                            {service.id === 'consolidation' && (
                                <div className="mb-6 p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 items-start animate-in fade-in slide-in-from-bottom-2">
                                    <Info className="text-amber-600 shrink-0 mt-0.5" size={16} />
                                    <p className="text-xs font-bold text-amber-800 leading-snug">
                                        {t('consolidationNote')}
                                    </p>
                                </div>
                            )}

                            <div className="pt-6 border-t border-gray-50 space-y-3 mt-auto">
                                <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                                    <CheckCircle size={14} className="text-green-500" /> 
                                    <span>{t('tagFast')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                                    <ShieldCheck size={14} className="text-blue-500" /> 
                                    <span>{t('tagGuarantee')}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA FINAL */}
            <div className="max-w-5xl mx-auto px-4 pb-24 text-center">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-10 md:p-14 shadow-2xl relative overflow-hidden text-white">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-gmc-dorado-principal/20 rounded-full blur-3xl -ml-20 -mb-20"></div>
                    
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-4xl font-bold font-garamond mb-4 text-white">
                            {t('ctaFooterTitle')}
                        </h2>
                        <p className="text-gray-300 mb-8 max-w-lg mx-auto text-lg">
                            {t('ctaFooterText')}
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link 
                                href="/registro-cliente" 
                                className="px-8 py-4 bg-gmc-dorado-principal text-black font-bold rounded-xl hover:bg-yellow-400 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                            >
                                {t('ctaBtnLocker')} <ArrowRight size={20}/>
                            </Link>
                            <Link 
                                href="/calculadora-costos" 
                                className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-all backdrop-blur-sm flex items-center justify-center gap-2"
                            >
                                {t('ctaBtnCalc')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}