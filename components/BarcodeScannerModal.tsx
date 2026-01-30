"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, CameraOff, Zap, ScanLine } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export default function BarcodeScannerModal({ isOpen, onClose, onScan }: BarcodeScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string>('');
  const [isPermitted, setIsPermitted] = useState(false);
  const [torchOn, setTorchOn] = useState(false); // Estado para la linterna

  useEffect(() => {
    if (!isOpen) return;

    // 🔥 FORMATOS COMPLETOS (Amazon TBA suele ser CODE_128)
    const formatsToSupport = [
      Html5QrcodeSupportedFormats.CODE_128,    // El 90% de los trackings (incluido Amazon TBA)
      Html5QrcodeSupportedFormats.DATA_MATRIX, // Cuadritos de Amazon
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.PDF_417,
      Html5QrcodeSupportedFormats.QR_CODE,
    ];

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode("reader-element");
        scannerRef.current = scanner;

        // Configuración de la cámara
        const config = {
          fps: 15, // Alta velocidad de escaneo
          // ⚠️ TRUCO MAESTRO: NO definimos 'qrbox'. 
          // Al no ponerlo, escanea TODA la pantalla. Esto arregla los códigos largos.
          aspectRatio: undefined, 
          formatsToSupport: formatsToSupport,
          experimentalFeatures: {
             useBarCodeDetectorIfSupported: true
          }
        };

        // Forzamos resolución HD para ver bien las barras finas
        const videoConstraints = {
            facingMode: "environment",
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
            focusMode: "continuous" // Intenta enfocar si el navegador lo permite
        };

        await scanner.start(
          videoConstraints,
          config,
          (decodedText) => {
            console.log("Detectado:", decodedText);
            
            // Filtro de seguridad: Evitar lecturas falsas muy cortas
            if (decodedText.length < 5) return;

            // Vibración
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(100);
            }

            scanner.stop().then(() => {
                scanner.clear();
                onScan(decodedText.trim());
            }).catch(err => console.error(err));
          },
          (errorMessage) => {
            // Ignorar errores por frame
          }
        );
        
        setIsPermitted(true);

        // Intentar activar linterna si está oscuro (Opcional)
        // applyVideoConstraints es avanzado, lo dejamos manual con botón.

      } catch (err: any) {
        console.error("Error cámara:", err);
        setError("Error de cámara. Asegúrate de estar en HTTPS y dar permisos.");
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

  // Función para encender/apagar Linterna
  const toggleTorch = async () => {
    if (scannerRef.current) {
        try {
            await scannerRef.current.applyVideoConstraints({
                advanced: [{ torch: !torchOn }] as any // Truco para TypeScript
            });
            setTorchOn(!torchOn);
        } catch (err) {
            console.log("Linterna no soportada", err);
        }
    }
  };

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

      <div className="w-full h-full relative flex flex-col">
        
        {/* HEADER */}
        <div className="absolute top-0 left-0 right-0 p-8 pt-12 z-40 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start">
             <div>
                <h2 className="text-white font-bold text-xl flex items-center gap-2 drop-shadow-md">
                    <ScanLine size={24} className="text-gmc-dorado-principal animate-pulse" />
                    Escáner Activo
                </h2>
                <p className="text-gray-300 text-xs mt-1">Acerca o aleja la cámara lentamente</p>
             </div>
        </div>

        {/* CÁMARA (FULL SCREEN) */}
        <div className="flex-1 relative bg-black overflow-hidden">
            <div id="reader-element" className="w-full h-full object-cover"></div>

            {/* GUI VISUAL (SOLO DECORATIVA, AHORA ESCANEA TODO) */}
            {isPermitted && !error && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    {/* Marco visual más ancho para códigos TBA */}
                    <div className="w-[90%] h-40 border-2 border-white/40 rounded-xl relative shadow-[0_0_100px_rgba(0,0,0,0.5)_inset]">
                        
                        {/* Esquinas activas */}
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-gmc-dorado-principal rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-gmc-dorado-principal rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-gmc-dorado-principal rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-gmc-dorado-principal rounded-br-lg"></div>

                        {/* Línea Láser */}
                        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-red-500 shadow-[0_0_15px_red] animate-[scan_2s_infinite]"></div>
                        
                        <p className="absolute -bottom-8 left-0 right-0 text-center text-white/80 text-xs font-bold uppercase tracking-widest">
                            Apunta aquí
                        </p>
                    </div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-50 text-white p-8 text-center">
                    <CameraOff size={48} className="mb-4 text-red-500" />
                    <p className="font-bold text-lg">Error de Cámara</p>
                    <p className="text-gray-400 text-sm mt-2">{error}</p>
                    <button onClick={onClose} className="mt-6 bg-white text-black px-6 py-3 rounded-xl font-bold">
                        Cerrar e intentar de nuevo
                    </button>
                </div>
            )}
        </div>

        {/* CONTROLES INFERIORES */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-6 z-50">
             {/* Botón Linterna */}
             <button 
                onClick={toggleTorch}
                className={`p-4 rounded-full backdrop-blur-md transition-all border ${
                    torchOn 
                    ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400' 
                    : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                }`}
             >
                <Zap size={24} className={torchOn ? "fill-yellow-400" : ""} />
             </button>
        </div>
      </div>
    </div>
  );
}