"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, Image as ImageIcon, Loader2 } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export default function BarcodeScannerModal({ isOpen, onClose, onScan }: BarcodeScannerModalProps) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Limpieza al cerrar
  useEffect(() => {
    if (!isOpen) {
      setError('');
      setProcessing(false);
    }
  }, [isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setError('');

    try {
      const html5QrCode = new Html5Qrcode("reader-hidden");
      
      const formats = [
        Html5QrcodeSupportedFormats.CODE_128,    
        Html5QrcodeSupportedFormats.DATA_MATRIX, 
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.UPC_A
      ];

      // Analizamos la foto estática (MUCHO MÁS SEGURO QUE VIDEO)
      const decodedText = await html5QrCode.scanFileV2(file, true);
      
      console.log("Scan result:", decodedText);
      
      if (decodedText && decodedText.decodedText) {
          if (navigator.vibrate) navigator.vibrate(200);
          onScan(decodedText.decodedText);
          onClose();
      } else {
          throw new Error("No se detectó código");
      }

    } catch (err: any) {
      console.error(err);
      setError("No se pudo leer el código. Intenta acercarte más o mejorar la luz.");
    } finally {
      setProcessing(false);
      // Limpiamos el input para permitir subir la misma foto si se desea
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerCamera = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center animate-fadeIn p-4">
      
      {/* Elemento oculto necesario para la librería */}
      <div id="reader-hidden" className="hidden"></div>

      <button 
        onClick={onClose}
        className="absolute top-5 right-5 bg-gray-800 text-white p-3 rounded-full z-50"
      >
        <X size={24} />
      </button>

      <div className="bg-white w-full max-w-sm rounded-2xl p-6 text-center shadow-2xl">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Escanear Paquete</h3>
        <p className="text-gray-500 text-sm mb-6">
            Toma una foto clara del código de barras.
        </p>

        {/* BOTÓN PRINCIPAL - Abre la cámara nativa */}
        <button 
            onClick={triggerCamera}
            disabled={processing}
            className="w-full bg-gmc-dorado-principal text-gmc-gris-oscuro py-5 rounded-xl font-bold text-lg shadow-md active:scale-95 transition-all flex items-center justify-center gap-3 mb-4"
        >
            {processing ? (
                <><Loader2 className="animate-spin" /> Procesando...</>
            ) : (
                <><Camera size={28} /> TOMAR FOTO</>
            )}
        </button>
        
        {/* Input oculto configurado para abrir cámara trasera directo */}
        <input 
            type="file"
            accept="image/*"
            capture="environment" // 🔥 ESTO ABRE LA CÁMARA DIRECTAMENTE
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
        />

        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium mt-2 border border-red-100">
                {error}
            </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
                Tip: Asegúrate de que el código esté enfocado y bien iluminado.
            </p>
        </div>
      </div>
    </div>
  );
}