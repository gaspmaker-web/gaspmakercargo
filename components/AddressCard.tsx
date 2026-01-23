"use client";

import React from 'react';
import { Copy, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl'; 

interface AddressCardProps {
  recipient: string;  
  suiteNo: string;    
  address?: string; 
  cityZip?: string; 
  country?: string; 
  phone?: string; 
}

const CopyButton = ({ text }: { text: string }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
  };

  return (
    <button 
      onClick={handleCopy} 
      className="ml-auto text-gray-400 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-blue-50"
      title="Copiar"
    >
      <Copy size={16} />
    </button>
  );
};

const AddressRow = ({ label, value, isHighlighted = false }: { label: string, value: string, isHighlighted?: boolean }) => (
  <div className={`flex items-center py-2 border-b border-gray-50 last:border-0 ${isHighlighted ? 'bg-blue-50/50 -mx-6 px-6 border-blue-100' : ''}`}>
    <span className="text-sm font-medium text-gray-500 w-40 flex-shrink-0">
      {label}:
    </span>
    <span className={`text-base font-bold flex-grow ${isHighlighted ? 'text-blue-800 text-lg' : 'text-gmc-gris-oscuro'}`}>
      {value}
    </span>
    <CopyButton text={value} />
  </div>
);

export default function AddressCard({ recipient, suiteNo }: AddressCardProps) {
  const t = useTranslations('AddressCard');
  
  const MIAMI_ADDRESS = "1861 NW 22nd St";
  const MIAMI_CITY_STATE = "Miami, FL 33142";
  const MIAMI_PHONE = "786-282-0763";
  const MIAMI_COUNTRY = "United States";

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 w-full">
      
      {/* 5. MOVIDO AQUÍ (ENCIMA DEL TÍTULO) */}
      <div className="mb-4 flex items-start gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded border border-gray-200">
        <span className="text-yellow-500 text-base">💡</span>
        <p>
          <strong>{t('tip')}:</strong> {t('tipText')}
        </p>
      </div>

      <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-100">
        <div className="bg-blue-50 p-2 rounded-full text-blue-600">
            <MapPin size={20} />
        </div>
        <h3 className="text-lg font-bold text-gmc-gris-oscuro font-garamond">
          {t('title')}
        </h3>
      </div>
      
      <div className="flex flex-col gap-1">
        <AddressRow label={t('recipient')} value={recipient} />
        <AddressRow label={t('address')} value={MIAMI_ADDRESS} />
        <AddressRow label={t('suite')} value={suiteNo || "PENDING"} isHighlighted={true} />
        <AddressRow label={t('cityZip')} value={MIAMI_CITY_STATE} />
        <AddressRow label={t('country')} value={MIAMI_COUNTRY} />
        <AddressRow label={t('phone')} value={MIAMI_PHONE} />
      </div>
      
    </div>
  );
}