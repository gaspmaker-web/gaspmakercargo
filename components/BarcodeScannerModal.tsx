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
  
  // Estado para el Zoom (Simplificado)
  const [zoom, setZoom] = useState(1);
  const [hasZoom, setHasZoom] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    
    // Limpieza inicial
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
      // Esperamos un poco para asegurar que el HTML existe
      await new Promise(r => setTimeout(r, 300));

      try {
        // Limpiar instancia previa si existe (evita conflictos)
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (e) {
                // Ignorar errores de parada
            }
        }

        const scanner = new Html5Qrcode("reader-element", {
            formatsToSupport: formatsToSupport,
            verbose: false
        });
        
        scannerRef.current = scanner;

        // 🔥 CONFIGURACIÓN SEGURA PARA IPHONE
        // No pedimos width/height específicos para evitar OverconstrainedError
        const videoConstraints = {
            facingMode: "environment", 
            focusMode: "continuous"
        };

        await scanner.start(
          videoConstraints, 
          {
            fps: 15,
            qrbox: { width: 280, height: 200 }, // Guía visual
            aspectRatio: 1.0,
            experimentalFeatures: {
                useBarCodeDetectorIfSupported: true
            }
          },
          (decodedText) => {
            // ÉXITO
            console.log("Scan:", decodedText);
            if (decodedText.length < 4) return; // Ignorar lecturas basura

            // Vibración
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(200);
            }
            
            // Detener y enviar
            scanner.stop().then(() => {
                scanner.clear();
                onScan(decodedText.trim());
            }).catch(console.error);
          },
          (errorMessage) => {
            // Ignorar errores por frame
          }
        );

        // 🔍 DETECCIÓN DE ZOOM SEGURA (Try/Catch crítico)
        try {
            const track = scanner.getRunningTrackCameraCapabilities();
            const capabilities = track as any;
            
            // Solo habilitamos zoom si el navegador dice explícitamente que puede
            if (capabilities && 'zoom' in capabilities) {
                setHasZoom(true);
                // Intentamos un pequeño zoom inicial (1.5x) para ayudar con códigos TBA
                applyZoom(1.5, scanner);
                setZoom(1.5);
            }
        } catch (e) {
            console.log("Zoom no soportado en este dispositivo (es normal)", e);
        }

        setLoading(false);

      } catch (err: any) {
        console.error("Error crítico cámara:", err);
        setError("No se pudo iniciar la cámara. Por favor cierra esta ventana y vuelve a intentar.");
        setLoading(false);
      }
    };

    startScanner();

    // Limpieza al cerrar modal
    return () => {
      if (scannerRef.current) {
         scannerRef.current.stop().catch(() => {}).finally(() => {
            scannerRef.current?.clear();
         });
      }
    };
  }, [isOpen, onScan]);

  // Función de Zoom Protegida
  const applyZoom = (zoomValue: number, scannerInstance = scannerRef.current) => {
    if (!scannerInstance) return;
    try {
        scannerInstance.applyVideoConstraints({
            advanced: [{ zoom: zoomValue }] as any
        }).catch(() => {}); // Si falla silenciosamente, no importa
    } catch (e) {
        // Ignorar
    }
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
        <div className="absolute top-0 left-0 right-0 p-8 pt-12 z-40 bg-gradient-to-b from-black/90 to-transparent flex justify-center">
             <h2 className="text-white font-bold text-lg flex items-center gap-2 drop-shadow-md">
                <ScanLine size={20} className="text-gmc-dorado-principal animate-pulse" />
                Escaneando...
             </h2>
        </div>

        {/* ÁREA DE CÁMARA */}
        <div className="flex-1 relative bg-black overflow-hidden flex items-center justify-center">
            
            {/* Contenedor del video */}
            <div id="reader-element" className="w-full h-full object-cover"></div>

            {/* GUI VISUAL (Solo si no hay error) */}
            {!error && !loading && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[85%] h-56 border-2 border-white/60 rounded-xl relative shadow-[0_0_0_999px_rgba(0,0,0,0.5)]">
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
                        max="3" // Limitamos a 3x para que no se pixelee mucho
                        step="0.1" 
                        value={zoom} 
                        onChange={handleZoomChange}
                        className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gmc-dorado-principal"
                    />
                </div>
             ) : (
                 <p className="text-center text-gray-400 text-xs">
                    Si el código no lee, intenta alejar o acercar el celular físicamente.
                 </p>
             )}
        </div>
      </div>
    </div>
  );
}