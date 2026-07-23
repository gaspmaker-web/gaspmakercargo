"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Loader2, ScanLine } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export default function BarcodeScannerModal({ isOpen, onClose, onScan }: BarcodeScannerModalProps) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    setError('');
    setLoading(true);

    const startScanner = async () => {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const reader = new BrowserMultiFormatReader();
        controlsRef.current = reader;

        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        const backCamera = devices.find(d =>
          d.label.toLowerCase().includes('back') ||
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        ) || devices[devices.length - 1];

        if (!backCamera) {
          setError('No se encontró cámara');
          return;
        }

        setLoading(false);

        await reader.decodeFromVideoDevice(
          backCamera.deviceId,
          videoRef.current!,
          (result, err) => {
            if (!active) return;
            if (result) {
              if (navigator.vibrate) navigator.vibrate(200);
              onScan(result.getText());
              onClose();
            }
          }
        );
      } catch (e) {
        console.error(e);
        setError('No se pudo acceder a la cámara. Verifica los permisos.');
        setLoading(false);
      }
    };

    startScanner();

    return () => {
      active = false;
      if (controlsRef.current?.reset) {
        controlsRef.current.reset();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 bg-black">
        <div className="flex items-center gap-2 text-white">
          <ScanLine size={20} className="text-yellow-400" />
          <span className="font-bold">Escáner</span>
        </div>
        <button onClick={onClose} className="bg-white/10 text-white p-2 rounded-full">
          <X size={22} />
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
        />

        {/* Línea de escaneo animada */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-72 h-40 border-2 border-yellow-400 rounded-lg relative">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-yellow-400 rounded-tl"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-yellow-400 rounded-tr"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-yellow-400 rounded-bl"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-yellow-400 rounded-br"></div>
            <div className="absolute w-full h-0.5 bg-yellow-400 animate-scan top-1/2"></div>
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
            <Loader2 size={40} className="text-yellow-400 animate-spin mb-3" />
            <p className="text-white text-sm">Iniciando cámara...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
            <Camera size={40} className="text-red-400 mb-3" />
            <p className="text-white text-sm">{error}</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-black text-center">
        <p className="text-gray-400 text-xs">Apunta la cámara al código de barras</p>
      </div>
    </div>
  );
}