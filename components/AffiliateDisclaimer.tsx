import React from 'react';
import { useTranslations } from 'next-intl';

export default function AffiliateDisclaimer() {
  const t = useTranslations('AffiliateDisclaimer');

  return (
    <section className="bg-white/80 backdrop-blur-sm text-gray-400 text-[10px] md:text-xs py-6 px-4 border-t border-gray-200 mt-auto w-full pb-20 md:pb-6">
      <div className="max-w-4xl mx-auto text-center leading-relaxed space-y-2">
        <p>
          <strong className="text-gray-500">{t('title')}:</strong> {t('text')}
        </p>
        <p className="italic text-gray-400">
          {t('amazon')}
        </p>
      </div>
    </section>
  );
}