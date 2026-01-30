"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, ScanLine, ZoomIn, ZoomOut, Zap } from 'lucide-react';

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
  
  // Controles
  const [zoom, setZoom] = useState(1);
  const [hasZoom, setHasZoom] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    
    // Resetear estados
    setError('');
    setIsPermitted(false);
    setLoading(true);
    setZoom(1);

    // Lista de formatos soportados
    const formatsToSupport = [
      Html5QrcodeSupportedFormats.CODE_128,    
      Html5QrcodeSupportedFormats.DATA_MATRIX, 
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.PDF_417,
      Html5QrcodeSupportedFormats.QR_CODE,
    ];

    const startScanner = async () => {
      // Esperar a que el DOM esté listo
      await new Promise(r => setTimeout(r, 200));

      try {
        if (scannerRef.current) {
            await scannerRef.current.stop().catch(() => {});
            scannerRef.current.clear();
        }

        // 🔥 CORRECCIÓN AQUÍ: Pasamos los formatos EN EL CONSTRUCTOR
        const scanner = new Html5Qrcode("reader-element", {
            formatsToSupport: formatsToSupport,
            verbose: false
        });
        
        scannerRef.current = scanner;

        // Configuración de la cámara
        const videoConstraints = {
            facingMode: "environment",
            focusMode: "continuous",
            width: { min: 640, ideal: 1280, max: 1920 }, 
            height: { min: 480, ideal: 720, max: 1080 },
        };

        // Configuración de escaneo (Ya SIN formatsToSupport aquí)
        const scanConfig = {
            fps: 15,
            qrbox: { width: 280, height: 200 },
            aspectRatio: 1.0,
            experimentalFeatures: {
                useBarCodeDetectorIfSupported: true
            }
        };

        await scanner.start(
          videoConstraints, 
          scanConfig,
          (decodedText) => {
            // ÉXITO
            console.log("Código:", decodedText);
            if (decodedText.length < 5) return;

            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(200);
            }
            
            // Cerrar y enviar
            scanner.stop().then(() => {
                scanner.clear();
                onScan(decodedText.trim());
            }).catch(err => console.error(err));
          },
          (errorMessage) => {
            // Ignorar errores de frame vacío
          }
        );

        // Detectar Zoom
        try {
            const track = scanner.getRunningTrackCameraCapabilities();
            const capabilities = track as any; 
            if (capabilities && capabilities.zoom) {
                setHasZoom(true);
                applyZoom(1.5, scanner); // Zoom inicial suave
                setZoom(1.5);
            }
        } catch (e) {
            console.log("No se pudo obtener capabilities de cámara", e);
        }
        
        setIsPermitted(true);
        setLoading(false);

      } catch (err: any) {
        console.error("Error cámara:", err);
        setError("No se pudo iniciar la cámara. Revisa los permisos.");
        setLoading(false);
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
         scannerRef.current.stop().catch(() => {}).finally(() => {
            scannerRef.current?.clear();
         });
      }
    };
  }, [isOpen, onScan]);

  const applyZoom = (zoomValue: number, scannerInstance = scannerRef.current) => {
    if (scannerInstance) {
        scannerInstance.applyVideoConstraints({
            advanced: [{ zoom: zoomValue }] as any
        }).catch(e => console.log("Zoom no soportado", e));
    }
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = parseFloat(e.target.value);
    setZoom(newZoom);
    applyZoom(newZoom);
  };

  const toggleTorch = async () => {
    if (scannerRef.current) {
        try {
            await scannerRef.current.applyVideoConstraints({
                advanced: [{ torch: !torchOn }] as any
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
        <div className="absolute top-0 left-0 right-0 p-6 pt-12 z-40 bg-gradient-to-b from-black/90 to-transparent flex flex-col items-center">
             <h2 className="text-white font-bold text-lg flex items-center gap-2 drop-shadow-md">
                <ScanLine size={20} className="text-gmc-dorado-principal animate-pulse" />
                Apunta al Código
             </h2>
        </div>

        {/* CÁMARA */}
        <div className="flex-1 relative bg-black overflow-hidden flex items-center justify-center">
            
            <div id="reader-element" className="w-full h-full object-cover"></div>

            {/* GUI VISUAL */}
            {isPermitted && !error && !loading && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[85%] h-48 border-2 border-white/60 rounded-xl relative shadow-[0_0_0_999px_rgba(0,0,0,0.5)]">
                        {/* Esquinas */}
                        <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-gmc-dorado-principal rounded-tl-lg"></div>
                        <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-gmc-dorado-principal rounded-tr-lg"></div>
                        <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-gmc-dorado-principal rounded-bl-lg"></div>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-gmc-dorado-principal rounded-br-lg"></div>
                        {/* Láser */}
                        <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-red-500 shadow-[0_0_15px_red] animate-[scan_2s_infinite]"></div>
                    </div>
                </div>
            )}

            {/* LOADING */}
            {loading && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white z-40">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gmc-dorado-principal mb-4"></div>
                    <p className="text-sm font-medium">Iniciando cámara HD...</p>
                </div>
            )}
        </div>

        {/* FOOTER CONTROLES */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md p-6 pb-10 z-50 rounded-t-3xl border-t border-white/10">
             
             {/* Slider Zoom */}
             {hasZoom && (
                <div className="flex items-center gap-4 mb-6 px-4">
                    <ZoomOut size={20} className="text-gray-400" />
                    <input 
                        type="range" 
                        min="1" 
                        max="5" 
                        step="0.1" 
                        value={zoom} 
                        onChange={handleZoomChange}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gmc-dorado-principal"
                    />
                    <ZoomIn size={20} className="text-gray-400" />
                </div>
             )}

             <div className="flex justify-center gap-8">
                {/* Botón Linterna */}
                <button 
                    onClick={toggleTorch}
                    className={`flex flex-col items-center gap-2 ${torchOn ? 'text-yellow-400' : 'text-gray-400'}`}
                >
                    <div className={`p-4 rounded-full border ${torchOn ? 'bg-yellow-400/20 border-yellow-400' : 'bg-white/10 border-white/20'}`}>
                        <Zap size={24} className={torchOn ? "fill-yellow-400" : ""} />
                    </div>
                    <span className="text-xs font-bold">Linterna</span>
                </button>
             </div>
        </div>
      </div>
    </div>
  );
}