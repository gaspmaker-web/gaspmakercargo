"use client";

import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react'; // 🔥 UI Premium
import { X, Lock, Key, CheckCircle } from 'lucide-react'; // 🔥 Iconos de seguridad
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

  // Manejador del envío (Lógica original intacta)
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
        // Reseteamos estados al cerrar
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
    // 🔥 Transición suave (Headless UI)
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        
        {/* Fondo con Blur */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            
            {/* Panel del Modal */}
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-[2rem] bg-white p-8 text-left align-middle shadow-2xl transition-all font-montserrat border border-gray-100">
                
                {/* Cabecera */}
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title as="h3" className="text-2xl font-bold text-gmc-gris-oscuro font-garamond tracking-tight">
                    {t('title')}
                  </Dialog.Title>
                  <button 
                    onClick={onClose} 
                    className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Contenido: Éxito o Formulario */}
                {success ? (
                  <div className="py-8 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle size={32} />
                    </div>
                    <p className="text-xl font-bold text-green-700">{t('success')}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Mensaje de Error */}
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium text-center border border-red-100 flex items-center justify-center gap-2">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    {/* Campo Contraseña Actual */}
                    <div className="group">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                        {t('currentLabel')}
                      </label>
                      <div className="relative">
                          <div className="absolute left-4 top-3.5 text-gray-300 group-focus-within:text-gmc-dorado-principal transition-colors">
                              <Lock size={18} />
                          </div>
                          <input
                            type="password"
                            required
                            placeholder={t('placeholderCurrent')}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-gray-700 font-medium outline-none focus:bg-white focus:border-gmc-dorado-principal focus:ring-4 focus:ring-gmc-dorado-principal/10 transition-all shadow-sm"
                          />
                      </div>
                    </div>

                    {/* Campo Nueva Contraseña */}
                    <div className="group">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                        {t('newLabel')}
                      </label>
                      <div className="relative">
                          <div className="absolute left-4 top-3.5 text-gray-300 group-focus-within:text-gmc-dorado-principal transition-colors">
                              <Key size={18} />
                          </div>
                          <input
                            type="password"
                            required
                            placeholder={t('placeholderNew')}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-gray-700 font-medium outline-none focus:bg-white focus:border-gmc-dorado-principal focus:ring-4 focus:ring-gmc-dorado-principal/10 transition-all shadow-sm"
                          />
                      </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex gap-4 pt-4">
                      <button 
                        type="button" 
                        onClick={onClose} 
                        className="flex-1 py-3.5 px-6 rounded-2xl border-2 border-gray-100 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-3.5 px-6 rounded-2xl bg-gmc-dorado-principal text-gmc-gris-oscuro font-bold shadow-lg hover:brightness-105 transition-all flex justify-center items-center"
                      >
                        {loading ? (
                             <div className="w-5 h-5 border-2 border-gray-800 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                             t('update')
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}