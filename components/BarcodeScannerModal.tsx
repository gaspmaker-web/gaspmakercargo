"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, CameraOff } from 'lucide-react';

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

    // 1. Configuración para códigos de envío (UPS, FedEx, USPS usan CODE_128)
    const formatsToSupport = [
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.QR_CODE,
    ];

    const startScanner = async () => {
      try {
        // Instanciamos el lector "RAW" (sin la interfaz fea por defecto)
        const scanner = new Html5Qrcode("reader-element");
        scannerRef.current = scanner;

        // Configuración de la cámara
        const config = {
          fps: 10, // Cuadros por segundo
          qrbox: { width: 280, height: 180 }, // Zona de lectura rectangular (ideal para tracking)
          aspectRatio: 1.0,
          formatsToSupport: formatsToSupport
        };

        // Iniciamos la cámara trasera
        await scanner.start(
          { facingMode: "environment" }, // "environment" fuerza la cámara trasera
          config,
          (decodedText) => {
            // ÉXITO: Código leído
            console.log("Código detectado:", decodedText);
            
            // Detenemos escáner
            scanner.stop().then(() => {
                scanner.clear();
                onScan(decodedText.trim()); // Enviamos el código limpio
            }).catch(err => console.error("Error al detener", err));
          },
          (errorMessage) => {
            // Error de lectura en cada frame (es normal, lo ignoramos)
          }
        );
        
        setIsPermitted(true);

      } catch (err: any) {
        console.error("Error iniciando cámara:", err);
        setError("No se pudo acceder a la cámara. Asegúrate de dar permisos.");
        setIsPermitted(false);
      }
    };

    // Pequeño delay para asegurar que el DOM (reader-element) existe
    const timer = setTimeout(() => {
      startScanner();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
         // Limpieza agresiva al cerrar
         scannerRef.current.stop().catch(() => {}).finally(() => {
            scannerRef.current?.clear();
         });
      }
    };
  }, [isOpen, onScan]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center animate-fadeIn">
      
      {/* Botón Cerrar Flotante */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 bg-white/20 text-white p-3 rounded-full backdrop-blur-md z-50 hover:bg-white/40 transition-all"
      >
        <X size={28} />
      </button>

      <div className="w-full max-w-lg relative flex flex-col items-center">
        
        <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            Escaneando Paquete...
        </h2>

        {/* CONTENEDOR DE LA CÁMARA */}
        <div className="relative w-full aspect-square bg-black overflow-hidden rounded-3xl border border-gray-800 shadow-2xl">
            
            {/* Elemento donde la librería inyecta el video */}
            <div id="reader-element" className="w-full h-full object-cover"></div>

            {/* GUI DE ESCANEO (Línea roja láser) */}
            {isPermitted && !error && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[85%] h-48 border-2 border-gmc-dorado-principal/50 rounded-xl relative overflow-hidden bg-white/5">
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-500 shadow-[0_0_20px_red] animate-[scan_2s_infinite]"></div>
                    </div>
                </div>
            )}

            {/* Mensaje de error si falla */}
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6 text-center">
                    <CameraOff size={48} className="mb-4 text-gray-500" />
                    <p>{error}</p>
                    <button onClick={onClose} className="mt-4 bg-white text-black px-4 py-2 rounded-lg font-bold">
                        Cerrar
                    </button>
                </div>
            )}
        </div>

        <p className="text-gray-400 text-sm mt-6 text-center px-8">
          Coloca el código de barras dentro del recuadro. <br/>
          Funciona mejor con buena iluminación.
        </p>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}