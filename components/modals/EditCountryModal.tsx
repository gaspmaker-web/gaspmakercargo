"use client";

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ALL_COUNTRIES } from '@/lib/countries';
import { useTranslations } from 'next-intl'; // 🔥 Importamos traducciones

interface EditCountryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newCountryCode: string) => void;
  currentCountryCode: string;
}

export default function EditCountryModal({ isOpen, onClose, onSave, currentCountryCode }: EditCountryModalProps) {
  // 🔥 Activamos el hook de traducción
  const t = useTranslations('EditCountryModal');

  const [selectedCode, setSelectedCode] = useState(currentCountryCode);
  const [isLoading, setIsLoading] = useState(false);

  // Sincronizar el estado cuando se abre el modal
  useEffect(() => {
    if (isOpen && currentCountryCode) {
      setSelectedCode(currentCountryCode);
    }
  }, [isOpen, currentCountryCode]);

  if (!isOpen) return null;

  const handleSaveClick = async () => {
    setIsLoading(true);
    try {
      await onSave(selectedCode);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 transition-opacity">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
        
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gmc-gris-oscuro font-garamond">{t('title')}</h2>
          <button 
            onClick={onClose} 
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Selector */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              {t('label')}
            </label>
            <select
              value={selectedCode}
              onChange={(e) => setSelectedCode(e.target.value)}
              disabled={isLoading}
              className="block w-full p-2 border border-gray-300 rounded-md shadow-sm text-lg text-gmc-gris-oscuro focus:ring-2 focus:ring-gmc-dorado-principal focus:border-gmc-dorado-principal outline-none"
            >
              {ALL_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="py-2 px-4 bg-gray-200 text-gmc-gris-oscuro font-bold rounded-lg hover:bg-gray-300 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSaveClick}
              disabled={isLoading}
              className="py-2 px-4 bg-gmc-dorado-principal text-gmc-gris-oscuro font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isLoading ? '...' : t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}