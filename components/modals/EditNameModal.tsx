"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

// Definimos las props que el modal necesita recibir
interface EditNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newName: string) => void;
  currentName: string;
}

export default function EditNameModal({ isOpen, onClose, onSave, currentName }: EditNameModalProps) {
  // 🔥 Hook de traducción
  const t = useTranslations('EditNameModal');

  // Estado interno para guardar lo que el usuario escribe
  const [name, setName] = useState(currentName);
  const [isLoading, setIsLoading] = useState(false); // Para mostrar un estado de "guardando"

  // Sincroniza el estado interno si el nombre actual cambia desde fuera
  React.useEffect(() => {
    setName(currentName);
  }, [currentName]);

  // Si no está abierto, no renderiza nada
  if (!isOpen) {
    return null;
  }

  const handleSaveClick = async () => {
    if (!name.trim()) return; // Evita guardar nombres vacíos

    setIsLoading(true);
    try {
      // Llamamos a la función onSave que nos pasó la página
      await onSave(name);
      onClose(); // Cierra el modal al guardar
    } catch (error) {
      console.error("Error al guardar el nombre:", error);
      // Aquí podrías mostrar un mensaje de error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Fondo semi-transparente (backdrop)
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity">
      
      {/* Contenedor del Modal */}
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md mx-4">
        
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

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-500">
              {t('label')}
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-lg text-gmc-gris-oscuro"
              disabled={isLoading}
            />
          </div>
          
          {/* Botones de Acción */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="py-2 px-4 bg-gray-200 text-gmc-gris-oscuro font-bold rounded-lg hover:bg-gray-300"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSaveClick}
              disabled={isLoading}
              className="py-2 px-4 bg-gmc-dorado-principal text-gmc-gris-oscuro font-bold rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? '...' : t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}




