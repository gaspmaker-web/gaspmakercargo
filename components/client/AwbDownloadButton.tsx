"use client";

import React, { useState, useEffect } from 'react';
import { FileText, X, ExternalLink, Download, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';

interface AwbDownloadButtonProps {
  url?: string | null;
  fileName?: string; // Opcional: Nombre del archivo al descargar
}

export default function AwbDownloadButton({ url, fileName = "AWB_Document.pdf" }: AwbDownloadButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  // Bloqueo de scroll global
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!url) return null;

  // 🔥 FUNCIÓN DE DESCARGA ENTERPRISE (Fuerza la descarga incluso entre dominios)
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
      link.download = fileName; // Forzamos el nombre del archivo
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading file:", error);
      // Fallback: abrir en nueva pestaña si falla el fetch
      window.open(url, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsLoading(true);
  };

  const ModalPortal = () => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={handleClose} />
      
      <div className="relative bg-white w-full h-full md:max-w-6xl md:h-[90vh] md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header Enterprise */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="bg-red-50 p-2.5 rounded-xl">
                <FileText size={22} className="text-red-500" />
            </div>
            <div>
                <h3 className="font-bold text-gray-900 text-sm md:text-lg leading-none font-garamond tracking-tight">Document Viewer</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1.5">Official AWB Document</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 🔥 BOTÓN DE DESCARGA REPARADO */}
            <button 
              onClick={handleDownload}
              disabled={isDownloading}
              className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all disabled:opacity-50"
              title="Descargar PDF"
            >
              {isDownloading ? <Loader2 size={22} className="animate-spin" /> : <Download size={22} />}
            </button>

            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
              title="Abrir en pestaña nueva"
            >
              <ExternalLink size={22} />
            </a>
            
            <div className="w-px h-8 bg-gray-100 mx-2 hidden md:block"></div>
            
            <button onClick={handleClose} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
              <X size={28} />
            </button>
          </div>
        </div>

        {/* Visor */}
        <div className="flex-1 bg-slate-100 relative">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-20">
              <Loader2 className="animate-spin text-blue-500 mb-3" size={40} strokeWidth={3} />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando Vista Previa...</p>
            </div>
          )}
          <iframe 
            src={`${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} 
            className="w-full h-full border-none"
            onLoad={() => setIsLoading(false)}
          />
        </div>

        <div className="md:hidden p-5 bg-white border-t border-gray-100">
            <button onClick={handleClose} className="w-full py-4 bg-slate-900 text-white text-sm font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-transform">
                Cerrar Visor
            </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button 
        onClick={(e) => { e.preventDefault(); setIsOpen(true); }}
        className="mt-3 flex items-center justify-center gap-2.5 w-full py-3.5 px-5 bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-black rounded-2xl hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all group shadow-sm active:scale-[0.98] tracking-widest uppercase"
      >
        <FileText size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
        <span>Ver Documento Aduanal</span>
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(<ModalPortal />, document.body)}
    </>
  );
}