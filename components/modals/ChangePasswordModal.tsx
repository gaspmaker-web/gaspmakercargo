"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  // 🔥 Hook de traducción
  const t = useTranslations('ChangePasswordModal');

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/user/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Usamos t('error') como fallback si no hay mensaje del servidor
        throw new Error(data.message || t('error'));
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setCurrentPassword("");
        setNewPassword("");
      }, 1500); // Cerrar automáticamente después de 1.5s
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gmc-gris-oscuro font-garamond">{t('title')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {success ? (
          <div className="p-4 bg-green-100 text-green-700 rounded-lg text-center">
            {t('success')}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">{t('currentLabel')}</label>
              <input
                type="password"
                required
                placeholder={t('placeholderCurrent')}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-gmc-dorado-principal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">{t('newLabel')}</label>
              <input
                type="password"
                required
                placeholder={t('placeholderNew')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-gmc-dorado-principal"
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div className="flex justify-end space-x-3 pt-2">
              <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 font-bold rounded-lg">
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="py-2 px-4 bg-gmc-dorado-principal text-gmc-gris-oscuro font-bold rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {loading ? '...' : t('update')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}