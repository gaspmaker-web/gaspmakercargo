"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, RefreshCw, ZoomIn, ZoomOut, Zap, ScanLine } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export default function BarcodeScannerModal({ isOpen, onClose, onScan }: BarcodeScannerModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState('');
  
  // Controles de Cámara
  const [zoom, setZoom] = useState(1.0);
  const [hasZoom, setHasZoom] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  // Limpieza al cerrar
  useEffect(() => {
    if (!isOpen) {
      stopScanner();
    } else {
      setIsScanning(false);
      setError('');
      setZoom(1.0);
      setHasZoom(false);
    }
  }, [isOpen]);

  const startScanner = async () => {
    setError('');
    
    try {
      // 1. FORMATOS COMPLETOS (Amazon usa Code 128 y DataMatrix)
      const formats = [
        Html5QrcodeSupportedFormats.CODE_128,    
        Html5QrcodeSupportedFormats.DATA_MATRIX, 
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.PDF_417
      ];

      // Instancia
      const scanner = new Html5Qrcode("reader-manual", {
        verbose: false,
        formatsToSupport: formats,
        experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
        }
      });
      
      scannerRef.current = scanner;

      // 2. CONFIGURACIÓN DE VIDEO HD (Clave para códigos largos)
      // Usamos 'ideal' para sugerir HD pero sin romper si no lo soporta
      const videoConstraints = {
        facingMode: "environment", 
        focusMode: "continuous",
        width: { min: 640, ideal: 1280, max: 1920 },
        height: { min: 480, ideal: 720, max: 1080 },
      };

      // 3. INICIO
      await scanner.start(
        videoConstraints, 
        {
          fps: 15,
          // ⚠️ TRUCO: qrbox indefinido o dinámico que cubra casi todo
          // Al hacerlo así, escanea CASI TODA la pantalla, no solo el centro.
          qrbox: (viewfinderWidth, viewfinderHeight) => {
             return {
                width: Math.floor(viewfinderWidth * 0.9), // 90% del ancho
                height: Math.floor(viewfinderHeight * 0.6)
             };
          },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Éxito
          console.log("SCAN:", decodedText);
          // Filtro de ruido (ignorar lecturas de menos de 4 caracteres)
          if (decodedText.length > 4) {
             if (navigator.vibrate) navigator.vibrate(200);
             
             // Reproducir sonido beep (opcional, si tienes el archivo)
             // const audio = new Audio('/beep.mp3'); audio.play().catch(()=>{});

             stopScanner();
             onScan(decodedText);
          }
        },
        () => {} // Ignorar errores de frame
      );

      setIsScanning(true);

      // 4. DETECCIÓN Y APLICACIÓN DE ZOOM
      try {
        const track = scanner.getRunningTrackCameraCapabilities();
        const capabilities = track as any;
        if (capabilities && 'zoom' in capabilities) {
            setHasZoom(true);
            // Aplicar un zoom inicial de 1.5x ayuda mucho al enfoque en iPhone
            applyZoom(1.5, scanner);
            setZoom(1.5);
        }
      } catch (e) {
        console.log("Zoom no disponible", e);
      }

    } catch (err: any) {
      console.error(err);
      setError("Error al iniciar cámara. Recarga la página.");
      setIsScanning(false);
    }
  };

  const applyZoom = (zoomValue: number, scannerInstance = scannerRef.current) => {
    if (scannerInstance) {
        scannerInstance.applyVideoConstraints({
            advanced: [{ zoom: zoomValue }] as any
        }).catch(e => console.log("Zoom error", e));
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
            console.log("Linterna error", err);
        }
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {}
      scannerRef.current = null;
      setIsScanning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center animate-fadeIn p-0 sm:p-4">
      
      {/* Botón Cerrar */}
      <button 
        onClick={() => { stopScanner(); onClose(); }}
        className="absolute top-4 right-4 bg-gray-800 text-white p-3 rounded-full hover:bg-gray-700 z-50 border border-gray-700"
      >
        <X size={24} />
      </button>

      <div className="w-full h-full sm:h-auto sm:max-w-md bg-black sm:bg-white rounded-none sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col relative">
        
        {/* HEADER (Solo visible si no está escaneando a full screen) */}
        {!isScanning && (
            <div className="bg-gmc-gris-oscuro p-6 text-center text-white">
                <h3 className="font-bold text-xl">Escáner Pro</h3>
                <p className="text-gray-400 text-sm mt-1">Listo para Tracking y Amazon</p>
            </div>
        )}

        {/* ÁREA DE VIDEO */}
        <div className="relative flex-1 bg-black flex flex-col items-center justify-center min-h-[400px]">
            
            {/* Div del video */}
            <div id="reader-manual" className={`w-full h-full ${!isScanning ? 'hidden' : 'block'}`}></div>

            {/* GUI DE ESCANEO (Líneas guía sobre el video) */}
            {isScanning && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[90%] h-[60%] border-2 border-white/40 rounded-lg relative">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-gmc-dorado-principal"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-gmc-dorado-principal"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-gmc-dorado-principal"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-gmc-dorado-principal"></div>
                        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-red-500/80 shadow-[0_0_10px_red]"></div>
                    </div>
                    <p className="absolute bottom-20 text-white/70 text-xs bg-black/50 px-3 py-1 rounded-full">
                        Mantén el código dentro del marco
                    </p>
                </div>
            )}

            {/* BOTÓN INICIAL */}
            {!isScanning && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 p-6 text-center">
                    <ScanLine size={64} className="text-gmc-dorado-principal mb-6 animate-pulse" />
                    <button 
                        onClick={startScanner}
                        className="bg-gmc-dorado-principal text-gmc-gris-oscuro w-full py-4 rounded-xl font-bold text-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3"
                    >
                        <Camera size={28} />
                        ACTIVAR CÁMARA
                    </button>
                    <p className="mt-6 text-gray-500 text-sm">
                        Permite el acceso a la cámara para escanear etiquetas de FedEx, UPS y Amazon.
                    </p>
                </div>
            )}

            {/* ERROR */}
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-6 text-center">
                    <p className="text-red-500 font-bold mb-4">{error}</p>
                    <button onClick={startScanner} className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-bold">
                        <RefreshCw size={18} /> Reintentar
                    </button>
                </div>
            )}
        </div>

        {/* CONTROLES (ZOOM Y LINTERNA) - Solo visibles escaneando */}
        {isScanning && (
            <div className="bg-black/80 backdrop-blur p-4 border-t border-white/10 absolute bottom-0 w-full z-40 pb-8">
                
                {/* ZOOM SLIDER */}
                {hasZoom && (
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <ZoomOut size={18} className="text-gray-400" />
                        <input 
                            type="range" 
                            min="1" 
                            max="3.0" 
                            step="0.1" 
                            value={zoom} 
                            onChange={handleZoomChange}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gmc-dorado-principal"
                        />
                        <ZoomIn size={18} className="text-gray-400" />
                    </div>
                )}

                <div className="flex justify-center items-center gap-6">
                    {/* LINTERNA */}
                    <button 
                        onClick={toggleTorch}
                        className={`p-3 rounded-full border ${torchOn ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-transparent text-white border-white/30'}`}
                    >
                        <Zap size={24} className={torchOn ? "fill-white" : ""} />
                    </button>

                    {/* DETENER */}
                    <button onClick={stopScanner} className="text-white text-sm font-bold bg-red-600/80 px-6 py-3 rounded-full hover:bg-red-600">
                        Detener
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}