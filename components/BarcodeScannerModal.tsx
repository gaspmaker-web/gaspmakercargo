"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, CameraOff, ScanLine, Zap } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export default function BarcodeScannerModal({ isOpen, onClose, onScan }: BarcodeScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string>('');
  const [isPermitted, setIsPermitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    
    // Resetear estados al abrir
    setError('');
    setIsPermitted(false);
    setLoading(true);

    // 🔥 CONFIGURACIÓN COMPATIBLE CON IPHONE (SAFARI)
    const formatsToSupport = [
      Html5QrcodeSupportedFormats.CODE_128,    // Tracking estándar
      Html5QrcodeSupportedFormats.DATA_MATRIX, // Amazon
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.PDF_417,     // USPS
      Html5QrcodeSupportedFormats.QR_CODE,
    ];

    let scanner: Html5Qrcode | null = null;

    const startScanner = async () => {
      // Pequeña espera para asegurar que el <div id="reader"> existe en el DOM
      await new Promise(r => setTimeout(r, 100));

      try {
        if (!document.getElementById("reader-element")) {
            console.error("Elemento reader-element no encontrado");
            return;
        }

        // Si ya había una instancia, limpiarla antes
        if (scannerRef.current) {
            await scannerRef.current.stop().catch(() => {});
            scannerRef.current.clear();
        }

        scanner = new Html5Qrcode("reader-element");
        scannerRef.current = scanner;

        const config = {
          fps: 10, // 10 FPS es suficiente y estable en iOS
          qrbox: { width: 300, height: 250 }, // Caja visual (pero escanea todo)
          aspectRatio: 1.0,
          formatsToSupport: formatsToSupport,
          experimentalFeatures: {
             useBarCodeDetectorIfSupported: true // Usa chip nativo si existe
          }
        };

        // ⚠️ CAMBIO CLAVE: Usamos configuración simple para iOS
        // No forzamos resolución HD manual, dejamos que Safari decida la mejor.
        await scanner.start(
          { facingMode: "environment" }, 
          config,
          (decodedText) => {
            // Éxito
            console.log("Código:", decodedText);
            
            // Filtro para evitar lecturas falsas cortas
            if (decodedText.length < 5) return;

            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(200);
            }

            // Detener y enviar
            scanner?.stop().then(() => {
                scanner?.clear();
                onScan(decodedText.trim());
            }).catch(err => console.error(err));
          },
          (errorMessage) => {
            // Ignorar errores de frame vacío
          }
        );
        
        setIsPermitted(true);
        setLoading(false);

      } catch (err: any) {
        console.error("Error iniciando cámara:", err);
        // Mensaje amigable para el usuario
        setError("No pudimos acceder a la cámara. Por favor, revisa que hayas dado permiso en tu navegador.");
        setLoading(false);
      }
    };

    startScanner();

    // Limpieza al desmontar el componente (cerrar modal)
    return () => {
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

      <div className="w-full h-full relative flex flex-col">
        
        {/* HEADER */}
        <div className="absolute top-0 left-0 right-0 p-8 pt-12 z-40 bg-gradient-to-b from-black/80 to-transparent flex justify-center">
             <h2 className="text-white font-bold text-lg flex items-center gap-2 drop-shadow-md">
                <ScanLine size={20} className="text-gmc-dorado-principal animate-pulse" />
                Escaneando...
             </h2>
        </div>

        {/* CÁMARA */}
        <div className="flex-1 relative bg-black overflow-hidden flex items-center justify-center">
            
            {/* El video se inyecta aquí */}
            <div id="reader-element" className="w-full h-full object-cover"></div>

            {/* GUI VISUAL */}
            {isPermitted && !error && !loading && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    {/* Marco visual */}
                    <div className="w-[85%] h-64 border-2 border-white/50 rounded-xl relative shadow-[0_0_100px_rgba(0,0,0,0.5)_inset]">
                        
                        {/* Esquinas */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-gmc-dorado-principal rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-gmc-dorado-principal rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-gmc-dorado-principal rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-gmc-dorado-principal rounded-br-lg"></div>

                        {/* Línea Roja */}
                        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-red-500 shadow-[0_0_15px_red] animate-[scan_2s_infinite]"></div>
                    </div>
                </div>
            )}

            {/* ERROR */}
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-50 text-white p-8 text-center">
                    <CameraOff size={48} className="mb-4 text-red-500" />
                    <p className="font-bold text-lg mb-2">Error de Acceso</p>
                    <p className="text-gray-400 text-sm">{error}</p>
                    <button onClick={onClose} className="mt-6 bg-white text-black px-6 py-3 rounded-xl font-bold">
                        Cerrar
                    </button>
                </div>
            )}

            {/* LOADING */}
            {loading && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white z-40">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-4"></div>
                    <p className="text-sm">Iniciando cámara...</p>
                </div>
            )}
        </div>

        {/* FOOTER TEXT */}
        <div className="absolute bottom-12 left-0 right-0 text-center px-6 z-40">
             <p className="text-gray-300 text-xs bg-black/50 py-2 px-4 rounded-full inline-block backdrop-blur-md">
                Si el código es largo, aleja un poco el celular
             </p>
        </div>
      </div>
    </div>
  );
}