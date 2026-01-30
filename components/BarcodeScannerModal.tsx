"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, RefreshCw, ZoomIn, ZoomOut, Zap, ScanLine, Settings } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export default function BarcodeScannerModal({ isOpen, onClose, onScan }: BarcodeScannerModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState('');
  const [permissionIssue, setPermissionIssue] = useState(false);
  
  // Controles
  const [zoom, setZoom] = useState(1.0);
  const [hasZoom, setHasZoom] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
    } else {
      // Reset total al abrir
      setIsScanning(false);
      setError('');
      setPermissionIssue(false);
      setZoom(1.0);
      setHasZoom(false);
    }
  }, [isOpen]);

  const startScanner = async () => {
    setError('');
    setPermissionIssue(false);
    
    // 1. Instanciamos el lector
    // Usamos un ID fijo y nos aseguramos de que el DOM esté listo
    if (!document.getElementById("reader-manual")) {
        setError("Error de carga. Cierra y abre de nuevo.");
        return;
    }

    try {
      const formats = [
        Html5QrcodeSupportedFormats.CODE_128,    
        Html5QrcodeSupportedFormats.DATA_MATRIX, 
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.PDF_417
      ];

      const scanner = new Html5Qrcode("reader-manual", {
        verbose: false,
        formatsToSupport: formats,
        experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
        }
      });
      
      scannerRef.current = scanner;

      // 2. ESTRATEGIA DE DOBLE INTENTO
      // Intento A: Configuración Ideal (HD)
      const hdConstraints = {
        facingMode: "environment", 
        focusMode: "continuous",
        width: { min: 640, ideal: 1280, max: 1920 }, // Intentamos forzar HD
        height: { min: 480, ideal: 720, max: 1080 },
      };

      // Intento B: Configuración Segura (Lo que sea que tenga el celular)
      const safeConstraints = {
        facingMode: "environment" // Sin restricciones de tamaño
      };

      try {
          // Intentamos HD primero
          await launchCamera(scanner, hdConstraints);
      } catch (hdError) {
          console.log("HD falló, intentando modo seguro...", hdError);
          // Si falla, intentamos modo seguro
          await launchCamera(scanner, safeConstraints);
      }

      setIsScanning(true);

      // Detectar Zoom después de iniciar
      try {
        const track = scanner.getRunningTrackCameraCapabilities();
        const capabilities = track as any;
        if (capabilities && 'zoom' in capabilities) {
            setHasZoom(true);
            applyZoom(1.5, scanner);
            setZoom(1.5);
        }
      } catch (e) {}

    } catch (err: any) {
      console.error("Error fatal:", err);
      
      // Detección específica de errores
      if (err?.name === 'NotAllowedError' || err?.message?.includes('permission')) {
          setPermissionIssue(true);
          setError("Acceso a cámara denegado.");
      } else if (err?.name === 'NotFoundError') {
          setError("No se encontró ninguna cámara trasera.");
      } else {
          setError("No se pudo iniciar la cámara. (Error técnico)");
      }
      
      setIsScanning(false);
    }
  };

  // Función auxiliar para iniciar la cámara
  const launchCamera = async (scanner: Html5Qrcode, constraints: any) => {
    await scanner.start(
        constraints, 
        {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
             // 90% del ancho para leer códigos largos
             return {
                width: Math.floor(viewfinderWidth * 0.9),
                height: Math.floor(viewfinderHeight * 0.5)
             };
          },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          console.log("SCAN:", decodedText);
          if (decodedText.length > 3) {
             if (navigator.vibrate) navigator.vibrate(200);
             stopScanner();
             onScan(decodedText);
          }
        },
        () => {}
      );
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
        } catch (err) { console.log(err); }
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
        
        {/* HEADER */}
        {!isScanning && (
            <div className="bg-gmc-gris-oscuro p-6 text-center text-white">
                <h3 className="font-bold text-xl">Escáner Pro</h3>
            </div>
        )}

        {/* ÁREA DE VIDEO */}
        <div className="relative flex-1 bg-black flex flex-col items-center justify-center min-h-[400px]">
            
            {/* Div del video */}
            <div id="reader-manual" className={`w-full h-full ${!isScanning ? 'hidden' : 'block'}`}></div>

            {/* GUI DE ESCANEO */}
            {isScanning && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[90%] h-[50%] border-2 border-white/40 rounded-lg relative">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-gmc-dorado-principal"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-gmc-dorado-principal"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-gmc-dorado-principal"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-gmc-dorado-principal"></div>
                        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-red-500/80 shadow-[0_0_10px_red]"></div>
                    </div>
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
                        Si te pide permiso, pulsa "Permitir".
                    </p>
                </div>
            )}

            {/* PANTALLA DE ERROR / PERMISOS */}
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-8 text-center z-50">
                    {permissionIssue ? (
                        <>
                            <Settings size={48} className="text-red-500 mb-4" />
                            <h3 className="font-bold text-lg text-gray-800 mb-2">Permiso Denegado</h3>
                            <p className="text-gray-600 text-sm mb-6">
                                Safari bloqueó la cámara. Para arreglarlo:
                                <br/><br/>
                                1. Toca el icono <b>"aA"</b> en la barra de dirección.
                                <br/>
                                2. Ve a <b>"Configuración del sitio web"</b>.
                                <br/>
                                3. En Cámara, selecciona <b>"Preguntar"</b> o <b>"Permitir"</b>.
                            </p>
                        </>
                    ) : (
                        <>
                             <p className="text-red-500 font-bold mb-4">{error}</p>
                        </>
                    )}
                    
                    <button onClick={startScanner} className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black">
                        <RefreshCw size={18} /> Intentar de nuevo
                    </button>
                </div>
            )}
        </div>

        {/* CONTROLES */}
        {isScanning && (
            <div className="bg-black/80 backdrop-blur p-4 border-t border-white/10 absolute bottom-0 w-full z-40 pb-8">
                {hasZoom && (
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <ZoomOut size={18} className="text-gray-400" />
                        <input 
                            type="range" min="1" max="3.0" step="0.1" 
                            value={zoom} onChange={handleZoomChange}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gmc-dorado-principal"
                        />
                        <ZoomIn size={18} className="text-gray-400" />
                    </div>
                )}
                <div className="flex justify-center gap-6">
                    <button onClick={toggleTorch} className={`p-3 rounded-full border ${torchOn ? 'bg-yellow-500 border-yellow-500' : 'border-white/30 text-white'}`}>
                        <Zap size={24} className={torchOn ? "fill-white" : ""} />
                    </button>
                    <button onClick={stopScanner} className="text-white text-sm font-bold bg-red-600/80 px-6 py-3 rounded-full">
                        Detener
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}