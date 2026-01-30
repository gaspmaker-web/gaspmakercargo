"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, ScanLine, AlertCircle, RefreshCw } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export default function BarcodeScannerModal({ isOpen, onClose, onScan }: BarcodeScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // Estado para el Zoom
  const [zoom, setZoom] = useState(1);
  const [hasZoom, setHasZoom] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    
    // Resetear estados
    setError('');
    setLoading(true);
    setZoom(1);
    setHasZoom(false);

    const formatsToSupport = [
      Html5QrcodeSupportedFormats.CODE_128,    
      Html5QrcodeSupportedFormats.DATA_MATRIX, 
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.UPC_A,
    ];

    const startScanner = async () => {
      // 1. ESPERA ACTIVA: Asegurar que el elemento HTML existe antes de iniciar
      // Esto soluciona la pantalla negra por "elemento no encontrado"
      let attempts = 0;
      while (!document.getElementById("reader-element") && attempts < 10) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }

      if (!document.getElementById("reader-element")) {
          setError("Error interno: No se pudo cargar el visor.");
          return;
      }

      try {
        // Limpiar instancia previa de forma segura
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (e) {
                console.log("Limpiando scanner previo...");
            }
        }

        const scanner = new Html5Qrcode("reader-element", {
            formatsToSupport: formatsToSupport,
            verbose: false
        });
        
        scannerRef.current = scanner;

        // 2. CONFIGURACIÓN "NATIVA": Sin restricciones forzadas
        const videoConstraints = {
            facingMode: "environment",
            focusMode: "continuous" 
        };

        await scanner.start(
          videoConstraints, 
          {
            fps: 15,
            // 3. CLAVE DEL ÉXITO: Sin aspectRatio forzado y sin qrbox estático
            // Esto permite que el iPhone use su relación de aspecto natural (4:3 o 16:9)
            qrbox: (viewfinderWidth, viewfinderHeight) => {
                // Creamos una caja dinámica rectangular (buena para códigos largos)
                return {
                    width: Math.floor(viewfinderWidth * 0.8),
                    height: Math.floor(viewfinderHeight * 0.4) // Rectángulo más chato
                };
            }
          },
          (decodedText) => {
            // ÉXITO
            console.log("Scan:", decodedText);
            if (decodedText.length < 4) return; 

            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(200);
            }
            
            scanner.stop().then(() => {
                scanner.clear();
                onScan(decodedText.trim());
            }).catch(console.error);
          },
          (errorMessage) => {
            // Ignorar errores por frame
          }
        );

        // Detección de Zoom
        try {
            const track = scanner.getRunningTrackCameraCapabilities();
            const capabilities = track as any;
            if (capabilities && 'zoom' in capabilities) {
                setHasZoom(true);
                // Zoom ligero inicial (1.2x) para ayudar al enfoque
                applyZoom(1.2, scanner);
                setZoom(1.2);
            }
        } catch (e) {
            // Ignorar si no hay zoom
        }

        setLoading(false);

      } catch (err: any) {
        console.error("Error crítico cámara:", err);
        setError("No se pudo iniciar la cámara. Verifica los permisos.");
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
    if (!scannerInstance) return;
    try {
        scannerInstance.applyVideoConstraints({
            advanced: [{ zoom: zoomValue }] as any
        }).catch(() => {}); 
    } catch (e) {}
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = parseFloat(e.target.value);
    setZoom(newZoom);
    applyZoom(newZoom);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center animate-fadeIn">
      
      {/* Botón Cerrar */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 bg-white/20 text-white p-3 rounded-full backdrop-blur-md z-50 hover:bg-red-500/80 active:scale-95 transition-all"
      >
        <X size={28} />
      </button>

      <div className="w-full h-full relative flex flex-col">
        
        {/* HEADER */}
        <div className="absolute top-0 left-0 right-0 p-8 pt-12 z-40 bg-gradient-to-b from-black/90 to-transparent flex justify-center pointer-events-none">
             <h2 className="text-white font-bold text-lg flex items-center gap-2 drop-shadow-md">
                <ScanLine size={20} className="text-gmc-dorado-principal animate-pulse" />
                Escaneando...
             </h2>
        </div>

        {/* ÁREA DE CÁMARA */}
        <div className="flex-1 relative bg-black overflow-hidden flex items-center justify-center">
            
            {/* 4. CONTENEDOR SEGURO:
               Le damos w-full y h-full para asegurar que ocupe espacio.
               El 'bg-black' evita el flash blanco.
            */}
            <div id="reader-element" className="w-full h-full bg-black object-cover relative z-10"></div>

            {/* MENSAJE DE ERROR */}
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-50 text-white p-8 text-center">
                    <AlertCircle size={48} className="mb-4 text-red-500" />
                    <p className="font-bold text-lg mb-2">Error de Cámara</p>
                    <p className="text-gray-400 text-sm mb-6">{error}</p>
                    <button onClick={() => window.location.reload()} className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold">
                        <RefreshCw size={18} /> Recargar Página
                    </button>
                </div>
            )}

            {/* LOADING SPINNER */}
            {loading && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white z-40">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gmc-dorado-principal mb-4"></div>
                    <p className="text-sm font-medium">Iniciando cámara...</p>
                </div>
            )}
        </div>

        {/* CONTROLES (ZOOM) */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md p-6 pb-10 z-50 rounded-t-3xl border-t border-white/10">
             {hasZoom ? (
                <div className="px-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-2 font-bold uppercase">
                        <span>Alejar</span>
                        <span>Acercar (Zoom)</span>
                    </div>
                    <input 
                        type="range" 
                        min="1" 
                        max="3" 
                        step="0.1" 
                        value={zoom} 
                        onChange={handleZoomChange}
                        className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gmc-dorado-principal"
                    />
                </div>
             ) : (
                 <p className="text-center text-gray-400 text-xs">
                    Cámara lista. Apunta al código.
                 </p>
             )}
        </div>
      </div>
    </div>
  );
}