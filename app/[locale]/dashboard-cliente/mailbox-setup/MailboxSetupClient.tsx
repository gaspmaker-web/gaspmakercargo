"use client";

import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, ArrowRight, FileText, Smartphone, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';

// 🔥 IMPORTAMOS NUESTRO NUEVO MODAL
import MailboxCheckoutModal from '@/components/dashboard/MailboxCheckoutModal';

interface MailboxSetupClientProps {
  savedCards?: any[]; 
}

export default function MailboxSetupClient({ savedCards = [] }: MailboxSetupClientProps) {
  const router = useRouter();
  const locale = useLocale(); // Necesario para la redirección dinámica
  const t = useTranslations('MailboxSetup');
  
  // Estados para controlar nuestro nuevo modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlanDetails, setSelectedPlanDetails] = useState({ name: '', price: 0 });

  // Lógica: Solo guardamos nombre/precio y abrimos el modal
  const handleSelectPlan = (planName: string, price: number) => {
    setSelectedPlanDetails({ name: planName, price });
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-montserrat relative">
      
      {/* 💳 NUESTRO MODAL CUSTOMIZADO */}
      <MailboxCheckoutModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        planName={selectedPlanDetails.name}
        price={selectedPlanDetails.price}
        savedCards={savedCards} 
        onSuccess={() => {
          // Cierra el modal y redirige al buzón usando el idioma actual
          setIsModalOpen(false);
          router.push(`/${locale}/dashboard-cliente/buzon`); 
        }}
      />

      {/* CONTENIDO DE LA PÁGINA */}
      <div className={`max-w-4xl mx-auto transition-all duration-300 ${isModalOpen ? 'blur-sm scale-[0.98] opacity-60' : ''}`}>
        
        {/* TÍTULO LIMPIO */}
        <div className="flex flex-col items-center justify-center mb-12 mt-2 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2A3342] font-garamond mb-2">{t('title')}</h1>
          <p className="text-sm sm:text-base text-gray-500 max-w-lg mx-auto">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto items-stretch">
          
          {/* PLAN BÁSICO */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 flex flex-col hover:shadow-xl transition-shadow relative h-full">
            <h2 className="text-xl font-bold text-gray-800 mb-2">{t('basicPlan.title')}</h2>
            <p className="text-sm text-gray-500 mb-6 min-h-[40px]">{t('basicPlan.description')}</p>
            <div className="mb-6"><span className="text-4xl font-extrabold text-gray-900">$7.99</span><span className="text-gray-500 font-medium">{t('perMonth')}</span></div>
            
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3 text-sm text-gray-700"><CheckCircle2 className="text-green-500" size={20} /><span>{t('basicPlan.feature1')}</span></li>
              <li className="flex items-start gap-3 text-sm text-gray-700"><CheckCircle2 className="text-green-500" size={20} /><span>{t('basicPlan.feature2')}</span></li>
              <li className="flex items-start gap-3 text-sm text-gray-700"><CheckCircle2 className="text-green-500" size={20} /><span>{t('basicPlan.feature3')}</span></li>
              <li className="flex items-start gap-3 text-sm text-gray-500"><Smartphone className="text-gray-400" size={20} /><span>{t('basicPlan.feature4')} <b>{t('basicPlan.feature4Price')}</b></span></li>
              <li className="flex items-start gap-3 text-sm text-gray-500"><FileText className="text-gray-400" size={20} /><span>{t('basicPlan.feature5')} <b>{t('basicPlan.feature5Price')}</b></span></li>
              <li className="flex items-start gap-3 text-sm text-gray-500"><Clock className="text-gray-400" size={20} /><span>{t('basicPlan.feature6')}</span></li>
            </ul>

            <button 
              onClick={() => handleSelectPlan(t('basicPlan.title'), 7.99)}
              className="w-full mt-auto bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-xl transition-colors flex justify-center gap-2"
            >
              {t('basicPlan.button')}
            </button>
          </div>

          {/* PLAN PREMIUM */}
          <div className="bg-blue-600 rounded-2xl shadow-xl border-2 border-blue-400 p-8 flex flex-col relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg uppercase">{t('premiumPlan.badge')}</div>
            <h2 className="text-xl font-bold text-white mb-2">{t('premiumPlan.title')}</h2>
            <p className="text-sm text-blue-100 mb-6 min-h-[40px]">{t('premiumPlan.description')}</p>
            <div className="mb-6"><span className="text-4xl font-extrabold text-white">$14.99</span><span className="text-blue-200 font-medium">{t('perMonth')}</span></div>
            
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3 text-sm text-white"><CheckCircle2 className="text-yellow-400" size={20} /><span>{t('premiumPlan.feature1')}</span></li>
              {/* 🔥 Característica 2 agregada para simetría */}
              <li className="flex items-start gap-3 text-sm text-white"><CheckCircle2 className="text-yellow-400" size={20} /><span>{t('premiumPlan.feature2')}</span></li>
              <li className="flex items-start gap-3 text-sm text-white font-semibold"><CheckCircle2 className="text-yellow-400" size={20} /><span>{t('premiumPlan.feature3')}</span></li>
              <li className="flex items-start gap-3 text-sm text-white font-semibold"><CheckCircle2 className="text-yellow-400" size={20} /><span>{t('premiumPlan.feature4')}</span></li>
              <li className="flex items-start gap-3 text-sm text-white"><ShieldCheck className="text-blue-200" size={20} /><span>{t('premiumPlan.feature5')}</span></li>
              {/* 🔥 Característica 6 agregada: Los 60 días */}
              <li className="flex items-start gap-3 text-sm text-white"><Clock className="text-blue-200" size={20} /><span>{t('premiumPlan.feature6')}</span></li>
            </ul>

            <button 
              onClick={() => handleSelectPlan(t('premiumPlan.title'), 14.99)}
              className="w-full mt-auto bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-3 px-4 rounded-xl shadow-lg flex justify-center items-center gap-2"
            >
              <>{t('premiumPlan.button')} <ArrowRight size={18} /></>
            </button>
          </div>

        </div>

        {/* 🔥 TEXTO LEGAL DE PROTECCIÓN ABAJO DE LAS TARJETAS */}
        <div className="mt-8 text-center max-w-2xl mx-auto px-4">
          <p className="text-xs text-gray-400 leading-relaxed">
            {t('legalDisclaimer')}
            <a href={`/${locale}/terms-of-service#mailbox-policies`} target="_blank" className="text-blue-500 hover:underline">
              {locale === 'en' ? 'Terms of Service' : locale === 'pt' ? 'Termos de Serviço' : locale === 'fr' ? 'Conditions de Service' : 'Términos de Servicio'}
            </a>.
          </p>
        </div>

      </div>
    </div>
  );
}