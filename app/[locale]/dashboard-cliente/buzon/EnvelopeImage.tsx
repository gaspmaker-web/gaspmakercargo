"use client";

import React, { useState, useEffect } from 'react';
import { X, ZoomIn } from 'lucide-react';

interface Props {
  imageUrl: string;
  senderName?: string | null;
}

export default function EnvelopeImage({ imageUrl, senderName }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  // Evitar que la pantalla del fondo haga scroll cuando la foto está abierta
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  return (
    <>
      {/* LA MINIATURA EN LA BANDEJA DE ENTRADA */}
      <div 
        onClick={() => setIsOpen(true)} 
        className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-200 cursor-pointer hover:shadow-lg hover:border-blue-400 transition-all relative group"
        title="Haz clic para ampliar vista"
      >
        <img src={imageUrl} alt="Sobre Recibido" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
            <ZoomIn className="text-white drop-shadow-md" size={24} />
        </div>
      </div>

      {/* EL MODAL DE PANTALLA COMPLETA */}
      {isOpen && (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in duration-200" 
            onClick={() => setIsOpen(false)}
        >
          <button 
            className="absolute top-4 right-4 sm:top-8 sm:right-8 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-all z-10"
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
          >
            <X size={32} />
          </button>
          
          <div 
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()} 
          >
            <img 
                src={imageUrl} 
                alt="Sobre Ampliado" 
                className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl" 
            />
            <p className="text-white text-center mt-6 font-medium tracking-wide bg-black/50 px-6 py-2 rounded-full text-sm">
                {senderName ? `Sobre de: ${senderName}` : 'Vista ampliada del sobre (Sin remitente registrado)'}
            </p>
          </div>
        </div>
      )}
    </>
  );
}