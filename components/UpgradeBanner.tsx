"use client";

import { useState } from 'react';
import { Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

// 🔥 1. IMPORTAMOS NUESTRO MODAL DE PAGO
import MailboxCheckoutModal from '@/components/dashboard/MailboxCheckoutModal';

export default function UpgradeBanner({ 
  currentPlan, 
  savedCards = [] 
}: { 
  currentPlan: string | undefined;
  savedCards?: any[];
}) {
  const router = useRouter();
  
  // 🔥 INICIALIZAMOS EL TRADUCTOR
  const t = useTranslations('Buzon');

  // 🔥 3. ESTADO PARA CONTROLAR CUÁNDO SE ABRE EL MODAL
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Solo mostramos este banner a los que tienen el plan Básico
  if (currentPlan !== 'BASIC_799' && currentPlan !== 'Digital Basic') return null;

  return (
    <>
      {/* 💳 4. NUESTRO MODAL LISTO PARA COBRAR */}
      <MailboxCheckoutModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        planName="Premium Cargo"
        price={14.99} 
        savedCards={savedCards} 
        onSuccess={() => {
          setIsModalOpen(false);
          // Al tener éxito, recargamos la página. El plan cambiará y este banner desaparecerá automáticamente.
          router.refresh(); 
        }}
      />

      {/* 5. EL DISEÑO MULTILINGÜE */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 text-white mb-6 animate-in fade-in">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-full shrink-0">
            <Zap className="text-yellow-400" size={24} />
          </div>
          <div>
            {/* 🔥 TEXTOS TRADUCIDOS DINÁMICAMENTE */}
            <h3 className="font-bold text-lg leading-tight">{t('upgradeBannerTitle')}</h3>
            <p className="text-blue-100 text-sm mt-1">{t('upgradeBannerDesc')}</p>
          </div>
        </div>
        <button 
          // 🔥 6. AL HACER CLIC, ABRIMOS EL MODAL
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto shrink-0 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-extrabold py-3 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
        >
          {t('upgradeBannerBtn')} ($14.99)
        </button>
      </div>
    </>
  );
}