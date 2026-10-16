"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScanLine, CheckCircle, XCircle, Package, Camera, X, Loader2, AlertTriangle, RotateCcw } from 'lucide-react';

interface ConsolidationPackage {
  id: string;
  gmcTrackingNumber: string;
  carrierTrackingNumber: string | null;
  description: string | null;
  weightLbs: number | null;
}

interface ScanResult {
  status: 'match' | 'mismatch' | 'not_found';
  scannedCode: string;
  package?: ConsolidationPackage;
  message: string;
}

interface Props {
  consolidationId: string;
  gmcShipmentNumber: string;
  packages: ConsolidationPackage[];
}

export default function ConsolidationScanner({ consolidationId, gmcShipmentNumber, packages }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [lastScanned, setLastScanned] = useState<ScanResult[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<any>(null);
  const resultTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🔥 Auto-focus en el input cuando se abre el scanner
  useEffect(() => {
    if (isOpen && !showCamera) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, showCamera]);

  // 🔥 Limpiar al cerrar
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScanResult(null);
      setInputValue('');
      setShowCamera(false);
    }
  }, [isOpen]);

  const stopCamera = () => {
    if (controlsRef.current?.reset) {
      controlsRef.current.reset();
    }
    controlsRef.current = null;
  };

  // 🔥 MOTOR DE VERIFICACIÓN — busca por gmcTrackingNumber O carrierTrackingNumber
  const verifyCode = useCallback((code: string) => {
    const cleaned = code.trim().toUpperCase();
    if (!cleaned) return;

    // Vibración táctil
    if (navigator.vibrate) navigator.vibrate(50);

    // Buscar en los paquetes de esta consolidación
    const found = packages.find(pkg =>
      pkg.gmcTrackingNumber?.toUpperCase() === cleaned ||
      pkg.carrierTrackingNumber?.toUpperCase() === cleaned
    );

    let result: ScanResult;

    if (found) {
      result = {
        status: 'match',
        scannedCode: cleaned,
        package: found,
        message: '✅ Package belongs to this consolidation'
      };
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Vibración éxito
    } else {
      // Verificar si el paquete existe pero en otra consolidación
      result = {
        status: 'mismatch',
        scannedCode: cleaned,
        message: '❌ Package does NOT belong to this consolidation'
      };
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]); // Vibración error
    }

    setScanResult(result);
    setLastScanned(prev => [result, ...prev.slice(0, 9)]); // Historial últimos 10
    setInputValue('');

    // Auto-limpiar resultado después de 4 segundos
    if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
    resultTimeoutRef.current = setTimeout(() => {
      setScanResult(null);
      inputRef.current?.focus();
    }, 4000);
  }, [packages]);

  // 🔥 Handler del input (Eyoyo Bluetooth envía Enter al final)
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      verifyCode(inputValue);
    }
  };

  // 🔥 Iniciar cámara como fallback
  const startCamera = async () => {
    setShowCamera(true);
    setCameraLoading(true);
    setCameraError('');

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
        setCameraError('No camera found');
        setCameraLoading(false);
        return;
      }

      setCameraLoading(false);

      await reader.decodeFromVideoDevice(
        backCamera.deviceId,
        videoRef.current!,
        (result) => {
          if (result) {
            verifyCode(result.getText());
          }
        }
      );
    } catch {
      setCameraError('Could not access camera. Check permissions.');
      setCameraLoading(false);
    }
  };

  const matchCount = lastScanned.filter(r => r.status === 'match').length;
  const mismatchCount = lastScanned.filter(r => r.status === 'mismatch').length;

  return (
    <>
      {/* 🔥 BOTÓN PARA ABRIR EL SCANNER */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-black text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-95"
      >
        <ScanLine size={18} className="text-yellow-400" />
        Scan Packages
      </button>

      {/* 🔥 MODAL DEL SCANNER */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

            {/* HEADER */}
            <div className="bg-slate-900 p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white flex items-center gap-2">
                  <ScanLine size={20} className="text-yellow-400" />
                  Package Verification
                </h3>
                <p className="text-xs text-gray-400 mt-0.5 font-mono">{gmcShipmentNumber} · {packages.length} packages</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <span className="text-xs bg-green-900/50 text-green-400 px-2 py-1 rounded font-bold">{matchCount} ✓</span>
                  <span className="text-xs bg-red-900/50 text-red-400 px-2 py-1 rounded font-bold">{mismatchCount} ✗</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* RESULTADO DEL SCAN */}
            {scanResult && (
              <div className={`p-4 flex items-center gap-4 animate-in slide-in-from-top-2 duration-200 ${
                scanResult.status === 'match' ? 'bg-green-50 border-b-2 border-green-500' : 'bg-red-50 border-b-2 border-red-500'
              }`}>
                {scanResult.status === 'match' ? (
                  <CheckCircle size={40} className="text-green-500 shrink-0" />
                ) : (
                  <XCircle size={40} className="text-red-500 shrink-0" />
                )}
                <div className="flex-1">
                  <p className={`font-bold text-lg ${scanResult.status === 'match' ? 'text-green-700' : 'text-red-700'}`}>
                    {scanResult.status === 'match' ? 'MATCH ✓' : 'MISMATCH ✗'}
                  </p>
                  {scanResult.package && (
                    <>
                      <p className="text-sm font-bold text-gray-800">{scanResult.package.description || 'No description'}</p>
                      <p className="text-xs font-mono text-gray-500">{scanResult.package.gmcTrackingNumber} · {scanResult.package.weightLbs} lbs</p>
                    </>
                  )}
                  {scanResult.status === 'mismatch' && (
                    <p className="text-xs text-red-600 font-mono mt-0.5">{scanResult.scannedCode}</p>
                  )}
                </div>
              </div>
            )}

            {/* AREA DE SCAN */}
            <div className="p-5">
              {!showCamera ? (
                <>
                  {/* INPUT PARA SCANNER BLUETOOTH */}
                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <ScanLine size={20} className="text-slate-400" />
                    </div>
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyDown={handleInputKeyDown}
                      placeholder="Scan or type tracking number..."
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-slate-200 rounded-xl font-mono text-base focus:border-slate-800 focus:ring-0 outline-none transition-all"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                    />
                  </div>

                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => inputValue.trim() && verifyCode(inputValue)}
                      disabled={!inputValue.trim()}
                      className="flex-1 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-sm disabled:opacity-40 hover:bg-black transition-all"
                    >
                      Verify
                    </button>
                    <button
                      onClick={startCamera}
                      className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all flex items-center gap-2"
                    >
                      <Camera size={16} /> Camera
                    </button>
                  </div>
                </>
              ) : (
                /* VISTA DE CÁMARA */
                <div className="relative rounded-xl overflow-hidden bg-black mb-4" style={{ height: 240 }}>
                  <video ref={videoRef} className="w-full h-full object-cover" />

                  {/* Overlay de escaneo */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-56 h-32 border-2 border-yellow-400 rounded-lg relative">
                      <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-yellow-400 rounded-tl"></div>
                      <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-yellow-400 rounded-tr"></div>
                      <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-yellow-400 rounded-bl"></div>
                      <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-yellow-400 rounded-br"></div>
                      <div className="absolute w-full h-0.5 bg-yellow-400 animate-scan top-1/2"></div>
                    </div>
                  </div>

                  {cameraLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                      <Loader2 size={32} className="text-yellow-400 animate-spin mb-2" />
                      <p className="text-white text-xs">Starting camera...</p>
                    </div>
                  )}

                  {cameraError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-4 text-center">
                      <AlertTriangle size={32} className="text-red-400 mb-2" />
                      <p className="text-white text-xs">{cameraError}</p>
                    </div>
                  )}

                  <button
                    onClick={() => { stopCamera(); setShowCamera(false); }}
                    className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              )}

              {/* LISTA DE PAQUETES DE ESTA CONSOLIDACIÓN */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 max-h-48 overflow-y-auto">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 pt-3 pb-1">
                  Packages in this consolidation ({packages.length})
                </p>
                {packages.map(pkg => {
                  const wasScanned = lastScanned.find(r => r.package?.id === pkg.id);
                  return (
                    <div key={pkg.id} className={`flex items-center gap-3 px-3 py-2 border-b border-gray-100 last:border-0 ${
                      wasScanned ? 'bg-green-50' : ''
                    }`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        wasScanned ? 'bg-green-500' : 'bg-gray-200'
                      }`}>
                        {wasScanned ? (
                          <CheckCircle size={12} className="text-white" />
                        ) : (
                          <Package size={10} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{pkg.description || 'No description'}</p>
                        <p className="text-[10px] font-mono text-gray-400">{pkg.gmcTrackingNumber}</p>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500">{pkg.weightLbs} lb</span>
                    </div>
                  );
                })}
              </div>

              {/* PROGRESO */}
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {matchCount} of {packages.length} verified
                </p>
                <div className="flex-1 mx-3 bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-green-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${packages.length > 0 ? (matchCount / packages.length) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs font-bold text-green-600">{packages.length > 0 ? Math.round((matchCount / packages.length) * 100) : 0}%</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}