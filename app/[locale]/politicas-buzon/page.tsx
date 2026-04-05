import React from 'react';
import { ShieldCheck, Clock, FileText, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function MailboxPolicyPage() {
  const t = useTranslations('MailboxPolicy');

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-10">
        
        {/* ENCABEZADO */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
            <ShieldCheck className="text-blue-700" size={32} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            {t('title')}
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        {/* CONTENIDO DE POLÍTICAS */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* Regla 1: Almacenamiento */}
          <div className="p-8 sm:p-10 border-b border-gray-100">
            <div className="flex items-start gap-4">
              <div className="bg-orange-50 p-3 rounded-2xl shrink-0 mt-1">
                <Clock className="text-orange-500" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">{t('storageTitle')}</h2>
                <p className="text-gray-600 mb-4 leading-relaxed">{t('storageDesc')}</p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm font-semibold text-gray-800 bg-gray-50 p-2 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> {t('storageBasic')}
                  </li>
                  <li className="flex items-center gap-2 text-sm font-semibold text-gray-800 bg-gray-50 p-2 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-yellow-400"></span> {t('storagePremium')}
                  </li>
                </ul>
                <p className="text-sm text-gray-500 italic border-l-4 border-orange-200 pl-3">
                  {t('storageAction')}
                </p>
              </div>
            </div>
          </div>

          {/* Regla 2: Uso Justo (Escaneos) */}
          <div className="p-8 sm:p-10 border-b border-gray-100 bg-blue-50/30">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-2xl shrink-0 mt-1">
                <FileText className="text-blue-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">{t('fairUseTitle')}</h2>
                <p className="text-gray-600 mb-4 leading-relaxed">{t('fairUseDesc')}</p>
                
                <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm mb-4">
                  <p className="text-blue-800 font-bold mb-1">🎁 {t('fairUseLimit')}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{t('fairUseExtra')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Regla 3: Trituración Segura */}
          <div className="p-8 sm:p-10">
            <div className="flex items-start gap-4">
              <div className="bg-green-50 p-3 rounded-2xl shrink-0 mt-1">
                <Lock className="text-green-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">{t('shredTitle')}</h2>
                <p className="text-gray-600 leading-relaxed">{t('shredDesc')}</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}