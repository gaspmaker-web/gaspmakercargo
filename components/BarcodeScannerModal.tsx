"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, ScanLine, AlertCircle } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export default function BarcodeScannerModal({ isOpen, onClose, onScan }: BarcodeScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // Usamos un ID único cada vez para forzar a React a limpiar el DOM
  const [componentKey] = useState(() => Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    if (!isOpen) return;
    
    // Limpieza de estados
    setError('');
    setLoading(true);

    const startScanner = async () => {
      // 1. ESPERA DE SEGURIDAD: Dar tiempo a que el Modal termine su animación de apertura
      await new Promise(r => setTimeout(r, 400));

      const elementId = `reader-${componentKey}`;
      const element = document.getElementById(elementId);

      if (!element) {
        setError("Error de renderizado. Cierra y abre de nuevo.");
        return;
      }

      try {
        // Limpiar cualquier instancia previa fantasma
        if (scannerRef.current) {
            try { await scannerRef.current.stop(); } catch (e) {}
            try { await scannerRef.current.clear(); } catch (e) {}
        }

        // 2. FORMATOS: Amazon (Code 128 / DataMatrix)
        const formatsToSupport = [
            Html5QrcodeSupportedFormats.CODE_128,    
            Html5QrcodeSupportedFormats.DATA_MATRIX, 
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.UPC_A
        ];

        const scanner = new Html5Qrcode(elementId, {
            formatsToSupport: formatsToSupport,
            verbose: false 
        });
        
        scannerRef.current = scanner;

        // 3. CONFIGURACIÓN BÁSICA (Sin focusMode ni zoom para evitar pantalla negra)
        // Solo pedimos la cámara trasera. Dejamos que el iPhone decida la resolución.
        const videoConstraints = {
            facingMode: "environment"
        };

        await scanner.start(
          videoConstraints, 
          {
            fps: 15,
            // qrbox dinámico: Ocupa el 80% del ancho disponible
            qrbox: (viewfinderWidth, viewfinderHeight) => {
                return {
                    width: Math.floor(viewfinderWidth * 0.8),
                    height: Math.floor(viewfinderHeight * 0.4)
                };
            },
            aspectRatio: 1.0 
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

        setLoading(false);

      } catch (err: any) {
        console.error("Error start:", err);
        setError("No se pudo acceder a la cámara. Asegúrate de estar en HTTPS y dar permisos.");
        setLoading(false);
      }
    };

    startScanner();

    return () => {
      // Limpieza agresiva al salir
      if (scannerRef.current) {
         scannerRef.current.stop().catch(() => {}).finally(() => {
            scannerRef.current?.clear();
         });
      }
    };
  }, [isOpen, onScan, componentKey]);

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
            
            {/* 🔥 CORRECCIÓN PANTALLA NEGRA:
                1. key={componentKey}: Fuerza a React a crear un div nuevo cada vez.
                2. id dinámico.
                3. Dimensiones explícitas w-full h-full.
            */}
            <div 
                key={componentKey}
                id={`reader-${componentKey}`} 
                className="w-full h-full bg-black relative z-10"
            ></div>

            {/* MENSAJE DE ERROR */}
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-50 text-white p-8 text-center">
                    <AlertCircle size={48} className="mb-4 text-red-500" />
                    <p className="font-bold text-lg mb-2">Error de Cámara</p>
                    <p className="text-gray-400 text-sm mb-6">{error}</p>
                    <button onClick={onClose} className="bg-white text-black px-6 py-3 rounded-xl font-bold">
                        Cerrar
                    </button>
                </div>
            )}

            {/* LOADING SPINNER */}
            {loading && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white z-40 pointer-events-none">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gmc-dorado-principal mb-4"></div>
                    <p className="text-sm font-medium">Iniciando cámara...</p>
                </div>
            )}
        </div>

        {/* FOOTER */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md p-6 pb-10 z-50 rounded-t-3xl border-t border-white/10 text-center">
            <p className="text-gray-300 text-xs">
                Apunta al código de barras. <br/>
                Si no enfoca, aleja un poco el celular.
            </p>
        </div>
      </div>
    </div>
  );
}