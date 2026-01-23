"use client";

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl'; // 🔥 Importamos traducciones
import { ALL_COUNTRIES } from '@/lib/countries';

interface EditAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { address: string; cityZip: string; country: string; phone: string }) => void;
  currentData: { address: string; cityZip: string; country: string; phone: string };
}

export default function EditAddressModal({ isOpen, onClose, onSave, currentData }: EditAddressModalProps) {
  // 🔥 Activamos el hook de traducción
  const t = useTranslations('EditAddressModal');

  const [formData, setFormData] = useState(currentData);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
        // Aseguramos que si ya hay un país, se trate como código en mayúsculas (ej: "IT")
        setFormData({
            ...currentData,
            country: currentData.country ? currentData.country.toUpperCase() : ''
        });
    }
  }, [isOpen, currentData]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 transition-opacity">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          {/* 🔥 Título Traducido */}
          <h2 className="text-xl font-bold text-gmc-gris-oscuro font-garamond">{t('title')}</h2>
          <button onClick={onClose} disabled={isLoading} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">{t('labelAddress')}</label>
            <input 
                name="address" 
                value={formData.address} 
                onChange={handleChange} 
                required 
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-gmc-dorado-principal focus:border-gmc-dorado-principal" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">{t('labelCityZip')}</label>
            <input 
                name="cityZip" 
                value={formData.cityZip} 
                onChange={handleChange} 
                required 
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-gmc-dorado-principal focus:border-gmc-dorado-principal" 
            />
          </div>

          {/* --- SELECTOR DE PAÍS --- */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">{t('labelCountry')}</label>
            <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-gmc-dorado-principal focus:border-gmc-dorado-principal bg-white text-gray-900"
            >
                <option value="">-</option>
                {ALL_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code.toUpperCase()}>
                        {c.name}
                    </option>
                ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">{t('labelPhone')}</label>
            <input 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange} 
                required 
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-gmc-dorado-principal focus:border-gmc-dorado-principal" 
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button 
                type="button" 
                onClick={onClose} 
                className="py-2 px-4 bg-gray-200 text-gmc-gris-oscuro font-bold rounded-lg hover:bg-gray-300 transition-colors"
            >
                {t('cancel')}
            </button>
            <button 
                type="submit" 
                disabled={isLoading} 
                className="py-2 px-4 bg-gmc-dorado-principal text-gmc-gris-oscuro font-bold rounded-lg hover:opacity-90 transition-opacity"
            >
                {isLoading ? '...' : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}