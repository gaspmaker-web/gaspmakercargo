"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { 
    ChevronDown, ChevronUp, HelpCircle, 
    AlertTriangle 
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: React.ReactNode;
  category: string;
}

export default function FaqClient() { // Renombrado para consistencia interna
    const t = useTranslations('FAQPage');
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    // 🔥 FUNCIÓN: Abre el chat de Tawk.to al hacer clic
    const handleOpenChat = () => {
        if (typeof window !== 'undefined' && (window as any).Tawk_API) {
            (window as any).Tawk_API.maximize();
        }
    };

    const faqs: FAQItem[] = [
        {
            category: t('cat1'), 
            question: t('q1'),
            answer: t('a1')
        },
        {
            category: t('cat2'),
            question: t('q2'),
            answer: t('a2')
        },
        {
            category: t('cat3'),
            question: t('q3'),
            answer: t('a3')
        },
        {
            category: t('cat4'), 
            question: t('q4'),
            answer: t('a4')
        },
        {
            category: t('cat5'), 
            question: t('q5'),
            answer: t('a5')
        },
        {
            category: t('cat6'), 
            question: t('q6'),
            answer: t('a6')
        }
    ];

    const toggleFaq = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="min-h-screen bg-gray-50 font-montserrat">
            {/* HERO SECTION */}
            <div className="relative bg-[#1a1f2e] text-white pt-24 pb-32 px-4 overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gmc-dorado-principal/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none"></div>
                <div className="relative z-10 max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
                        <HelpCircle size={12} className="text-gmc-dorado-principal" />
                        <span className="text-xs font-bold tracking-wider text-gray-200 uppercase">
                            {t.has('hero_badge') ? t('hero_badge') : 'FAQ / Help Center'}
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold font-garamond mb-6 text-white tracking-tight">
                        {t('title')}
                    </h1>
                    <p className="text-gray-300 text-lg max-w-2xl mx-auto font-light">
                        {t('subtitle')}
                    </p>
                </div>
            </div>

            {/* SECCIÓN DE CONTENIDO */}
            <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-20 pb-20">
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div 
                            key={index} 
                            className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden transition-all duration-300"
                        >
                            <button 
                                onClick={() => toggleFaq(index)}
                                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex gap-4 items-center">
                                    <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded uppercase tracking-wider shrink-0">
                                        {faq.category}
                                    </span>
                                    <h3 className="font-bold text-gray-800 text-sm md:text-base leading-tight">
                                        {faq.question}
                                    </h3>
                                </div>
                                {openIndex === index ? <ChevronUp size={20} className="text-gmc-dorado-principal" /> : <ChevronDown size={20} className="text-gray-400" />}
                            </button>

                            {openIndex === index && (
                                <div className="p-6 pt-0 text-gray-600 text-sm md:text-base border-t border-gray-50 leading-relaxed animate-in slide-in-from-top-2 duration-300">
                                    {faq.answer}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* INFO BOX ADICIONAL */}
                <div className="mt-12 bg-white rounded-3xl p-8 border border-dashed border-gray-300 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-16 h-16 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center shrink-0">
                        <AlertTriangle size={32} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 mb-1">
                            {t.has('footerbox_title') ? t('footerbox_title') : '¿No encuentras lo que buscas?'}
                        </h4>
                        <p className="text-sm text-gray-500">
                            {t.has('footerbox_text') ? t('footerbox_text') : 'Contáctanos si tienes dudas específicas.'}
                        </p>
                    </div>
                    
                    <button 
                        onClick={handleOpenChat}
                        className="whitespace-nowrap px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all"
                    >
                        {t.has('footerbox_btn') ? t('footerbox_btn') : 'Contactar Soporte'}
                    </button>
                </div>
            </div>
        </div>
    );
}