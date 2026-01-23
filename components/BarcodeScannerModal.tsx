"use client";

import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export default function BarcodeScannerModal({ isOpen, onClose, onScan }: BarcodeScannerModalProps) {
  
  useEffect(() => {
    if (!isOpen) return;

    // Configuración del escáner
    const scanner = new Html5QrcodeScanner(
      "reader", 
      { 
        fps: 10, 
        qrbox: { width: 250, height: 150 }, // Formato rectangular mejor para códigos de barras
        aspectRatio: 1.0 
      },
      /* verbose= */ false
    );

    // Callback de éxito
    const onScanSuccess = (decodedText: string) => {
      // Limpiamos el texto (a veces trae caracteres extra)
      const cleanText = decodedText.trim();
      onScan(cleanText);
      
      // Detenemos el escáner y cerramos
      scanner.clear().catch(err => console.error("Error clearing scanner", err));
      onClose();
    };

    // Renderizar
    scanner.render(onScanSuccess, (errorMessage) => {
      // Ignoramos errores de "no code found" que ocurren en cada frame
    });

    // Limpieza al desmontar
    return () => {
      scanner.clear().catch(() => {});
    };
  }, [isOpen, onClose, onScan]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md relative">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-600 p-1 rounded-full bg-gray-100"
        >
          <X size={24} />
        </button>

        <h2 className="text-xl font-bold text-center mb-4 text-gmc-gris-oscuro font-garamond">
          Escanear Tracking
        </h2>
        
        {/* Aquí se monta el video de la cámara */}
        <div id="reader" className="overflow-hidden rounded-lg"></div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Apunta la cámara al código de barras o QR del paquete.
        </p>
      </div>
    </div>
  );
}