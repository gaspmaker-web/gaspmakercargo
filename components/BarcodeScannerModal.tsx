"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, CameraOff, Zap } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export default function BarcodeScannerModal({ isOpen, onClose, onScan }: BarcodeScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string>('');
  const [isPermitted, setIsPermitted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // 🔥 CONFIGURACIÓN "TODO TERRENO" PARA LOGÍSTICA
    // Activamos DataMatrix (Amazon), PDF417 (USPS/Licencias), ITF (Cajas grandes)
    const formatsToSupport = [
      Html5QrcodeSupportedFormats.CODE_128,    // Estándar Tracking (FedEx, UPS, GMC)
      Html5QrcodeSupportedFormats.CODE_39,     // Estándar antiguo
      Html5QrcodeSupportedFormats.EAN_13,      // Productos comerciales
      Html5QrcodeSupportedFormats.UPC_A,       // Productos USA
      Html5QrcodeSupportedFormats.DATA_MATRIX, // ⚠️ IMPORTANTE: Amazon y piezas pequeñas
      Html5QrcodeSupportedFormats.PDF_417,     // USPS y Documentos
      Html5QrcodeSupportedFormats.ITF,         // Cajas master
      Html5QrcodeSupportedFormats.QR_CODE,     // QR Normal
      Html5QrcodeSupportedFormats.CODABAR,     // Logística varia
    ];

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode("reader-element");
        scannerRef.current = scanner;

        // Configuración de la cámara
        const config = {
          fps: 15, // Aumentamos FPS para lectura más rápida
          qrbox: { width: 300, height: 200 }, // Área un poco más grande
          aspectRatio: 1.0,
          formatsToSupport: formatsToSupport,
          // Intenta usar la detección nativa del navegador si existe (es más rápida)
          experimentalFeatures: {
             useBarCodeDetectorIfSupported: true
          }
        };

        await scanner.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            // ÉXITO
            console.log("Código detectado:", decodedText);
            
            // Vibración fuerte para confirmar
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
            }

            scanner.stop().then(() => {
                scanner.clear();
                onScan(decodedText.trim());
            }).catch(err => console.error("Error al detener", err));
          },
          (errorMessage) => {
            // Ignoramos errores de frame vacío
          }
        );
        
        setIsPermitted(true);

      } catch (err: any) {
        console.error("Error iniciando cámara:", err);
        setError("No se pudo acceder a la cámara. Revisa los permisos en tu navegador.");
        setIsPermitted(false);
      }
    };

    const timer = setTimeout(() => {
      startScanner();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
         scannerRef.current.stop().catch(() => {}).finally(() => {
            scannerRef.current?.clear();
         });
      }
    };
  }, [isOpen, onScan]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center animate-fadeIn">
      
      {/* Botón Cerrar */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 bg-white/20 text-white p-3 rounded-full backdrop-blur-md z-50 hover:bg-white/40 active:scale-95 transition-all"
      >
        <X size={28} />
      </button>

      <div className="w-full max-w-lg relative flex flex-col items-center h-full justify-center">
        
        <h2 className="text-white font-bold text-xl mb-6 flex items-center gap-2 drop-shadow-md">
            <Zap size={24} className="text-yellow-400 fill-yellow-400" />
            Buscando Código...
        </h2>

        {/* CÁMARA */}
        <div className="relative w-[90%] aspect-square max-w-md bg-black overflow-hidden rounded-3xl border-2 border-gray-700 shadow-2xl">
            
            <div id="reader-element" className="w-full h-full object-cover"></div>

            {/* GUI LÁSER MEJORADA */}
            {isPermitted && !error && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    {/* Marco Esquinas */}
                    <div className="w-[85%] h-56 border-2 border-white/30 rounded-2xl relative">
                        
                        {/* Esquinas Blancas Brillantes */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-gmc-dorado-principal rounded-tl-xl shadow-[0_0_10px_#D4AF37]"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-gmc-dorado-principal rounded-tr-xl shadow-[0_0_10px_#D4AF37]"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-gmc-dorado-principal rounded-bl-xl shadow-[0_0_10px_#D4AF37]"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-gmc-dorado-principal rounded-br-xl shadow-[0_0_10px_#D4AF37]"></div>

                        {/* Línea Roja Láser */}
                        <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-red-600 shadow-[0_0_15px_red] animate-[scan_1.5s_infinite]"></div>
                    </div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 text-white p-6 text-center backdrop-blur-sm">
                    <CameraOff size={48} className="mb-4 text-red-400" />
                    <p className="font-bold mb-2">{error}</p>
                    <button onClick={onClose} className="mt-4 bg-white text-black px-6 py-2 rounded-full font-bold">
                        Cerrar
                    </button>
                </div>
            )}
        </div>

        <div className="mt-8 text-center space-y-2">
            <p className="text-white font-bold text-lg">Apunta al Código de Barras</p>
            <p className="text-gray-400 text-sm px-6">
                Soporta: Tracking, Amazon (DataMatrix), FedEx, UPS, USPS.
                <br/>Mantén el celular estable.
            </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(-80px); opacity: 0.5; }
          50% { opacity: 1; }
          100% { transform: translateY(80px); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}