"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, Loader2, ScanLine, AlertTriangle } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export default function BarcodeScannerModal({ isOpen, onClose, onScan }: BarcodeScannerModalProps) {
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setStatus('');
      setProcessing(false);
    }
  }, [isOpen]);

  // --- FUNCIÓN MÁGICA: PROCESADO DE IMAGEN ---
  const processImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 1. Redimensionar (Max 1000px para que sea rápido y nítido)
            const MAX_WIDTH = 1000;
            const scale = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scale;

            if (!ctx) { reject(new Error("Error de canvas")); return; }

            // Dibujar imagen redimensionada
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // 2. Convertir a Blanco y Negro (Alto Contraste)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                // Umbralización simple: Si es oscuro es negro, si es claro es blanco
                const color = avg < 100 ? 0 : 255; 
                data[i] = color;     // R
                data[i + 1] = color; // G
                data[i + 2] = color; // B
            }
            ctx.putImageData(imageData, 0, 0);

            // Devolver imagen procesada
            canvas.toBlob((blob) => {
                if (blob) {
                    const processedFile = new File([blob], "processed.jpg", { type: "image/jpeg" });
                    resolve(processedFile);
                } else {
                    reject(new Error("Error al procesar imagen"));
                }
            }, 'image/jpeg', 0.9);
        };
        img.onerror = (e) => reject(e);
        img.src = URL.createObjectURL(file);
    });
  };

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setError('');
    setStatus('Optimizando imagen...');

    try {
      // PASO 1: Procesar la imagen (Blanco y Negro)
      const optimizedFile = await processImage(file);
      
      setStatus('Analizando código...');

      // PASO 2: Escanear la imagen optimizada
      const html5QrCode = new Html5Qrcode("reader-hidden");
      
      const formats = [
        Html5QrcodeSupportedFormats.CODE_128,    
        Html5QrcodeSupportedFormats.DATA_MATRIX, 
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.PDF_417
      ];

      // Intentamos leer
      const result = await html5QrCode.scanFileV2(optimizedFile, true);
      
      console.log("SCAN RESULT:", result);
      
      if (result && result.decodedText) {
          if (navigator.vibrate) navigator.vibrate(200);
          onScan(result.decodedText);
          onClose(); 
      } else {
          throw new Error("No se encontró código");
      }

    } catch (err: any) {
      console.error(err);
      setError("No pudimos leer el código. Intenta de nuevo acercándote más.");
    } finally {
      setProcessing(false);
      setStatus('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openNativeCamera = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center animate-fadeIn p-4">
      
      <div id="reader-hidden" className="hidden"></div>

      <button 
        onClick={onClose}
        className="absolute top-6 right-6 bg-white/10 text-white p-3 rounded-full hover:bg-white/20 z-50 backdrop-blur-md"
      >
        <X size={24} />
      </button>

      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl relative">
        
        <div className="bg-gray-900 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400"></div>
            <ScanLine size={48} className="text-yellow-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white">Escáner Mejorado</h3>
            <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest">Con Alto Contraste</p>
        </div>

        <div className="p-8 text-center">
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                Este modo convierte tu foto a <b>Blanco y Negro</b> automáticamente para detectar mejor los códigos difíciles.
            </p>

            {/* CONSEJO CLAVE */}
            <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-lg mb-6 text-left flex gap-3">
                <AlertTriangle size={20} className="text-yellow-600 shrink-0" />
                <p className="text-xs text-yellow-800">
                    <b>Importante:</b> Toma la foto de cerca (15cm). El código debe ocupar gran parte de la imagen.
                </p>
            </div>

            <button 
                onClick={openNativeCamera}
                disabled={processing}
                className="w-full bg-yellow-400 text-black py-5 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 mb-4 hover:bg-yellow-300 disabled:opacity-70 disabled:grayscale"
            >
                {processing ? (
                    <><Loader2 className="animate-spin" size={24} /> {status}</>
                ) : (
                    <><Camera size={28} /> TOMAR FOTO</>
                )}
            </button>
            
            <input 
                type="file"
                accept="image/*"
                capture="environment" 
                ref={fileInputRef}
                onChange={handleCapture}
                className="hidden"
            />

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 animate-fadeIn text-center">
                    {error}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}