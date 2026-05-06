"use client";

import React, { useState, useEffect } from 'react';
import { FileSearch, Image as ImageIcon, X, Download, ExternalLink, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Props {
  url: string;
  isPdf: boolean;
  btnText: string;
}

export default function DocumentViewerButton({ url, isPdf, btnText }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const t = useTranslations('Buzon');

  // Bloqueo de scroll global (Nivel Enterprise)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // 🔥 FUNCIÓN DE DESCARGA ENTERPRISE (Fuerza la descarga real)
  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDownloading(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      // Generamos un nombre profesional para el cliente
      link.download = isPdf ? `GaspMaker_Doc_${Date.now()}.pdf` : `GaspMaker_Img_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(url, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 group"
      >
        {isPdf ? (
          <FileSearch size={16} className="text-red-500 group-hover:scale-110 transition-transform" />
        ) : (
          <ImageIcon size={16} className="text-blue-500 group-hover:scale-110 transition-transform" />
        )}
        {btnText}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-2 sm:p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Cabecera Premium */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <div className={isPdf ? "bg-red-50 p-2 rounded-lg" : "bg-blue-50 p-2 rounded-lg"}>
                  {isPdf ? <FileSearch size={20} className="text-red-500" /> : <ImageIcon size={20} className="text-blue-500" />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm md:text-base font-garamond tracking-tight leading-none">
                    {t('documentViewerTitle') || 'Visor de Documentos'}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                    Gasp Maker Cargo • Enterprise Viewer
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* BOTÓN DE DESCARGA REPARADO */}
                <button 
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all disabled:opacity-50"
                  title={t('btnDownload') || "Descargar"}
                >
                  {isDownloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                </button>

                <a 
                  href={url} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all hidden md:flex"
                  title={t('openNewTab') || "Abrir en nueva pestaña"}
                >
                  <ExternalLink size={20} />
                </a>

                <div className="w-px h-8 bg-gray-100 mx-2 hidden md:block"></div>

                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Contenido del Documento "Clean View" */}
            <div className="flex-1 bg-slate-100 w-full h-full p-2 sm:p-4 overflow-hidden flex justify-center items-center">
              {isPdf ? (
                <iframe 
                  src={`${url}#toolbar=0&navpanes=0&view=FitH`} 
                  className="w-full h-full rounded-2xl border border-gray-200 bg-white shadow-inner"
                  title="Document Preview"
                />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center p-4">
                    <img 
                      src={url} 
                      alt="Scanned" 
                      className="max-w-full max-h-full object-contain rounded-2xl shadow-xl bg-white"
                    />
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}