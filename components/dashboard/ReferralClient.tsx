"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl'; 
import { Copy, Gift, DollarSign, CheckCircle, Share2, Users, HelpCircle, AlertCircle, ShieldAlert } from 'lucide-react';

interface ReferralClientProps {
    referralCode: string;
    walletBalance: number; 
    referralLink: string;  
}

export default function ReferralClient({ referralCode, walletBalance, referralLink }: ReferralClientProps) {
    const t = useTranslations('Referral'); 
    const [copied, setCopied] = useState(false);

    // Función Copiar
    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Función Compartir
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Gasp Maker Cargo',
                    text: t('heroText'),
                    url: referralLink,
                });
            } catch (error) {
                console.log('Error sharing', error);
            }
        } else {
            handleCopy();
        }
    };

    return (
        // 🔥 APLICAMOS FONT-MONTSERRAT A TODO EL CONTENEDOR
        <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500 font-montserrat">
            
            {/* 1. HEADER & BALANCE */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gmc-gris-oscuro tracking-tight">
                        {t('title')}
                    </h1>
                    <p className="text-gray-500 mt-1">{t('subtitle')}</p>
                </div>
                
                {/* Tarjeta de Saldo */}
                <div className="bg-gradient-to-r from-gmc-gris-oscuro to-black text-white p-6 rounded-2xl shadow-lg flex items-center gap-5 min-w-[300px] transform hover:scale-105 transition-transform">
                    <div className="bg-white/20 p-3 rounded-full">
                        <DollarSign size={32} className="text-gmc-dorado-principal" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-300 uppercase font-bold tracking-wider mb-1">{t('creditAvailable')}</p>
                        {/* 🔥 NÚMEROS RECTOS Y MODERNOS (lining-nums) */}
                        <p className="text-4xl font-extrabold text-white lining-nums tracking-tight font-montserrat">
                            ${walletBalance.toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. HERO SECTION */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                <div className="bg-blue-50 p-8 text-center border-b border-blue-100">
                    <Gift size={64} className="mx-auto text-blue-600 mb-4 animate-bounce" />
                    
                    <h2 className="text-2xl md:text-3xl font-bold text-gmc-gris-oscuro mb-2 tracking-tight">
                        {t('heroTitle')}
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed mb-4">
                        {t('heroText')}
                    </p>

                    <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border border-blue-200">
                        <AlertCircle size={14} />
                        <span>{t('minOrderBadge')}</span>
                    </div>
                </div>

                {/* Área del Link */}
                <div className="p-8 bg-white">
                    <label className="block text-xs font-bold text-gray-400 mb-3 text-center uppercase tracking-widest">
                        {t('linkTitle')}
                    </label>
                    
                    <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
                        {/* El link se mantiene en font-mono solo para legibilidad técnica, pero limpio */}
                        <div className="flex-1 bg-gray-50 border-2 border-dashed border-gmc-dorado-principal/50 rounded-xl p-4 flex items-center justify-center text-gray-700 font-mono text-sm md:text-base break-all text-center">
                            {referralLink}
                        </div>
                        
                        <div className="flex gap-2 justify-center">
                            <button 
                                onClick={handleCopy}
                                className={`flex items-center gap-2 px-6 py-4 rounded-xl font-bold transition-all shadow-md active:scale-95 min-w-[140px] justify-center ${
                                    copied 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-gmc-dorado-principal text-gmc-gris-oscuro hover:brightness-105'
                                }`}
                            >
                                {copied ? <CheckCircle size={20}/> : <Copy size={20}/>}
                                {copied ? t('copiedBtn') : t('copyBtn')}
                            </button>

                            <button 
                                onClick={handleShare}
                                className="p-4 bg-gray-100 text-gray-600 rounded-xl border border-gray-200 hover:bg-gray-200 transition-colors"
                                title="Compartir"
                            >
                                <Share2 size={20}/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. PASOS (STEPS) */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Share2 size={24}/>
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-gray-800">{t('step1Title')}</h3>
                    <p className="text-sm text-gray-500 leading-snug">{t('step1Text')}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users size={24}/>
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-gray-800">{t('step2Title')}</h3>
                    <p className="text-sm text-gray-500 leading-snug">
                        {t('step2Text')}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <DollarSign size={24}/>
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-gray-800">{t('step3Title')}</h3>
                    <p className="text-sm text-gray-500 leading-snug">{t('step3Text')}</p>
                </div>
            </div>

            {/* 4. TERMINOS Y CONDICIONES (LEGAL TEXT) */}
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200">
                <h3 className="text-lg font-bold text-gmc-gris-oscuro mb-4 flex items-center gap-2 uppercase tracking-wide">
                    <ShieldAlert size={20} className="text-gmc-dorado-principal"/> {t('termsTitle')}
                </h3>
                
                <ul className="space-y-3 text-sm text-gray-600 list-disc pl-5 leading-relaxed">
                    <li>{t('term1')}</li>
                    <li>{t('term2')}</li>
                    <li>{t('term3')}</li>
                    <li>{t('term4')}</li>
                    <li>{t('term5')}</li>
                    <li>{t('term6')}</li>
                    <li>{t('term7')}</li>
                    <li>{t('term8')}</li>
                </ul>
            </div>

            {/* 5. PREGUNTAS FRECUENTES (FAQ) */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gmc-gris-oscuro mb-6 flex items-center gap-2">
                    <HelpCircle className="text-gmc-dorado-principal"/> {t('faqTitle')}
                </h3>
                <div className="space-y-6 divide-y divide-gray-100">
                    <div className="pt-2">
                        <p className="font-bold text-gray-800 mb-1 flex gap-2">
                            {/* 🔥 LA Q MODERNA: font-montserrat + font-extrabold = Q geométrica perfecta */}
                            <span className="text-gmc-dorado-principal font-extrabold font-montserrat">Q:</span> 
                            {t('faq1Q')}
                        </p>
                        <p className="text-gray-600 text-sm pl-6">{t('faq1A')}</p>
                    </div>
                    <div className="pt-4">
                        <p className="font-bold text-gray-800 mb-1 flex gap-2">
                            <span className="text-gmc-dorado-principal font-extrabold font-montserrat">Q:</span> 
                            {t('faq2Q')}
                        </p>
                        <p className="text-gray-600 text-sm pl-6">{t('faq2A')}</p>
                    </div>
                    <div className="pt-4">
                        <p className="font-bold text-gray-800 mb-1 flex gap-2">
                            <span className="text-gmc-dorado-principal font-extrabold font-montserrat">Q:</span> 
                            {t('faq3Q')}
                        </p>
                        <p className="text-gray-600 text-sm pl-6">{t('faq3A')}</p>
                    </div>
                </div>
            </div>

        </div>
    );
}