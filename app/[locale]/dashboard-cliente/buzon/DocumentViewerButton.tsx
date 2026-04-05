"use client";

import React, { useState, useEffect } from 'react';
import { FileSearch, Image as ImageIcon, X, Download, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Props {
  url: string;
  isPdf: boolean;
  btnText: string;
}

export default function DocumentViewerButton({ url, isPdf, btnText }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('Buzon');

  // Evita que el fondo haga scroll cuando el modal está abierto
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
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm active:scale-95"
      >
        {isPdf ? <FileSearch size={16} className="text-red-500" /> : <ImageIcon size={16} className="text-blue-500" />}
        {btnText}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-2 sm:p-6 transition-opacity">
          <div className="bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Cabecera del Visor */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gray-50/80">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm sm:text-base truncate pr-2">
                {isPdf ? <FileSearch className="text-red-500 shrink-0" /> : <ImageIcon className="text-blue-500 shrink-0" />}
                <span className="truncate">{t('documentViewerTitle') || 'Visor de Documentos'}</span>
              </h3>
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <a 
                  href={url} 
                  download 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  title={t('btnDownload') || "Descargar"}
                >
                  <Download size={18} />
                </a>
                <a 
                  href={url} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors hidden sm:flex"
                  title={t('openNewTab') || "Abrir en nueva pestaña"}
                >
                  <ExternalLink size={18} />
                </a>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors ml-1 sm:ml-2"
                  title={t('btnClose') || "Cerrar"}
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Contenido del Documento */}
            <div className="flex-1 bg-gray-200/50 w-full h-full p-2 sm:p-4 overflow-hidden flex justify-center items-center">
              {isPdf ? (
                <iframe 
                  src={`${url}#view=FitH`} 
                  className="w-full h-full rounded-xl border border-gray-300 bg-white shadow-sm"
                  title="Document Viewer"
                />
              ) : (
                <img 
                  src={url} 
                  alt="Scanned Document" 
                  className="max-w-full max-h-full object-contain rounded-xl shadow-sm border border-gray-300 bg-white"
                />
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}