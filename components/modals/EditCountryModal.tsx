"use client";

import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react'; // 🔥 UI Premium
import { X, Globe } from 'lucide-react'; // 🔥 Agregamos icono Globe
import { ALL_COUNTRIES } from '@/lib/countries';
import { useTranslations } from 'next-intl';

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

  // Sincronizar el estado cuando se abre el modal (Igual que el original)
  useEffect(() => {
    if (isOpen) {
      // Si currentCountryCode viene vacío, podríamos poner 'US' por defecto, 
      // pero respetamos tu lógica original de usar lo que venga.
      setSelectedCode(currentCountryCode || 'US');
    }
  }, [isOpen, currentCountryCode]);

  // Manejador de guardado (Adaptado para prevenir recarga si se usa dentro de un form)
  const handleSaveClick = async (e?: React.FormEvent) => {
    if (e) e.preventDefault(); 
    
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
                
                {/* Encabezado */}
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title as="h3" className="text-2xl font-bold text-gmc-gris-oscuro font-garamond tracking-tight">
                    {t('title')}
                  </Dialog.Title>
                  <button 
                    onClick={onClose} 
                    disabled={isLoading}
                    className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSaveClick} className="space-y-6">
                  <div className="group">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                      {t('label')}
                    </label>
                    
                    <div className="relative">
                        {/* Icono del Mundo a la izquierda */}
                        <div className="absolute left-4 top-3.5 text-gray-300 group-focus-within:text-gmc-dorado-principal transition-colors">
                            <Globe size={18} />
                        </div>
                        
                        <select
                          value={selectedCode}
                          onChange={(e) => setSelectedCode(e.target.value)}
                          disabled={isLoading}
                          className="w-full pl-11 pr-8 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-gray-700 font-medium outline-none focus:bg-white focus:border-gmc-dorado-principal focus:ring-4 focus:ring-gmc-dorado-principal/10 transition-all shadow-sm appearance-none cursor-pointer"
                        >
                          {ALL_COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.name}
                            </option>
                          ))}
                        </select>

                        {/* Flecha personalizada a la derecha */}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                    </div>
                  </div>
                  
                  {/* Botones Estilizados */}
                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isLoading}
                      className="flex-1 py-3.5 px-6 rounded-2xl border-2 border-gray-100 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-3.5 px-6 rounded-2xl bg-gmc-dorado-principal text-gmc-gris-oscuro font-bold shadow-lg hover:brightness-105 transition-all flex justify-center items-center"
                    >
                      {isLoading ? (
                         <div className="w-5 h-5 border-2 border-gray-800 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                         t('save')
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}