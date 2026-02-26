"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Camera, CheckCircle, Loader2, ArrowLeft, PenTool, Navigation, Map, User, Phone, PackageCheck, AlertCircle, Box, Layers } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas'; 

export default function DeliveryClient({ 
    packageId, locale, deliveryAddress, clientName, clientPhone, tracking, clientNote = "", countryCode = "US",
    childPackages = [], isConsolidation = false // 🔥 RECIBIMOS LOS PAQUETES
}: { 
    packageId: string, locale: string, deliveryAddress: string, clientName: string, clientPhone: string, tracking: string, clientNote?: string, countryCode?: string,
    childPackages?: any[], isConsolidation?: boolean
}) {
  const router = useRouter();
  const sigPad = useRef<any>(null);
  
  const [step, setStep] = useState(2);
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const getCountryTheme = (code: string) => {
      const upperCode = code?.toUpperCase();
      switch (upperCode) {
          case 'US': return 'border-yellow-400 ring-yellow-50'; 
          case 'TT': return 'border-purple-300 ring-purple-50'; 
          case 'VE': return 'border-blue-300 ring-blue-50';      
          case 'DO': return 'border-red-300 ring-red-50';        
          default: return 'border-gray-200 ring-gray-50';
      }
  };
  const themeClasses = getCountryTheme(countryCode);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
        const data = new FormData();
        data.append('file', file);
        data.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default');
        const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: data });
        const json = await res.json();
        if (json.secure_url) setPhotoUrl(json.secure_url);
    } catch (error) { alert("Error subiendo foto"); } finally { setUploading(false); }
  };

  const handleCompleteDelivery = async () => {
    if (!photoUrl) return alert("📸 La foto es obligatoria.");
    if (sigPad.current?.isEmpty()) return alert("✍️ La firma es obligatoria.");
    setLoading(true);
    const signatureData = sigPad.current.toDataURL(); 
    try {
        const res = await fetch('/api/driver/complete-delivery', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Enviamos un flag si es consolidación para que la API cierre todos los paquetes
            body: JSON.stringify({ packageId, photoUrl, signatureBase64: signatureData, isConsolidation })
        });
        if (res.ok) {
            setStep(3);
            setTimeout(() => { router.push(`/${locale}/dashboard-driver`); router.refresh(); }, 3000);
        } else {
            const err = await res.json(); alert("Error al guardar: " + (err.error || "Desconocido"));
        }
    } catch (e) { alert("Error de conexión"); } finally { setLoading(false); }
  };

  if (step === 3) {
      return (
          <div className="min-h-screen bg-green-600 flex flex-col items-center justify-center text-white p-6 animate-in fade-in">
              <CheckCircle size={80} className="mb-4 text-white"/>
              <h1 className="text-3xl font-bold mb-2 uppercase italic">¡Entrega Exitosa!</h1>
          </div>
      );
  }

  if (step === 1) {
      // (Mantenemos tu paso 1 oculto tal cual como lo tenías)
      return (
        <div className="min-h-screen bg-gray-50/50 p-4 font-sans pb-24 animate-in fade-in flex flex-col items-center pt-8">
            <div className="w-full max-w-md">
                <button onClick={() => router.push(`/${locale}/dashboard-driver`)} className="mb-6 flex items-center text-gray-500 font-bold text-sm hover:text-black transition">
                    <ArrowLeft size={18} className="mr-1" /> Volver al Inicio
                </button>
                <div className={`bg-white rounded-2xl p-6 shadow-sm border-2 ring-4 mb-6 ${themeClasses}`}>
                    <div className="flex gap-4 items-center mb-4">
                        <div className="w-8 h-8 rounded-full bg-[#1e2330] text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">2</div>
                        <div>
                            <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-800">Punto de Entrega</h3>
                            <p className="text-[11px] text-gray-400 font-medium">Destino Final</p>
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-6 leading-tight pr-4">{deliveryAddress}</h2>
                    <div className="flex gap-3 mb-6">
                        <a href={`https://waze.com/ul?q=${encodeURIComponent(deliveryAddress)}`} target="_blank" className="flex-1 py-2.5 bg-[#f0f5ff] text-[#2563eb] rounded-xl flex items-center justify-center gap-2 text-xs font-bold border border-blue-100 shadow-sm">
                            <Navigation size={14} className="text-blue-600"/> Waze
                        </a>
                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(deliveryAddress)}`} target="_blank" className="flex-1 py-2.5 bg-white text-gray-700 rounded-xl flex items-center justify-center gap-2 text-xs font-bold border border-gray-200 shadow-sm">
                            <Map size={14} className="text-gray-500"/> Google Maps
                        </a>
                    </div>
                    <button onClick={() => setStep(2)} className="w-full bg-[#1e2330] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95">
                        <PackageCheck size={20}/> INICIAR ENTREGA
                    </button>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans pb-10 animate-in slide-in-from-right pt-8 flex flex-col items-center">
      <div className="w-full max-w-md">
          <button onClick={() => router.back()} className="flex items-center text-gray-500 mb-6 font-bold text-sm hover:text-black transition">
            <ArrowLeft size={18} className="mr-1"/> Volver a la Ruta
          </button>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h1 className="text-xl font-bold text-gray-800 mb-2 uppercase tracking-wide">Evidencia de Entrega</h1>
            
            {/* 🔥 TÍTULO INTELIGENTE (Caja vs Paquete) */}
            <div className={`mb-6 p-3 rounded-lg border flex items-center gap-3 ${isConsolidation ? 'bg-purple-50 border-purple-100' : 'bg-gray-50 border-gray-100'}`}>
                <div className={`p-2 rounded-full ${isConsolidation ? 'bg-purple-200 text-purple-700' : 'bg-gray-200 text-gray-700'}`}>
                    {isConsolidation ? <Layers size={18}/> : <PackageCheck size={18}/>}
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {isConsolidation ? 'Caja Consolidada' : 'Tracking'}
                    </p>
                    <p className="text-sm font-mono font-bold text-gray-800">{tracking}</p>
                </div>
            </div>

            {/* 🔥 CONTENIDO DE LA CAJA (DISEÑO AMAZON FLEX) 🔥 */}
            {isConsolidation && childPackages.length > 0 && (
                <div className="mb-6 border border-purple-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-[#222b3c] px-4 py-3 flex items-center justify-between">
                        <h3 className="text-xs font-bold text-[#EAD8B1] uppercase flex items-center gap-2">
                            <Box size={14} /> Contenido de la Caja
                        </h3>
                        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                            {childPackages.length} Paquetes
                        </span>
                    </div>
                    <div className="divide-y divide-gray-100 bg-white max-h-48 overflow-y-auto">
                        {childPackages.map((pkg: any) => (
                            <div key={pkg.id} className="p-3 hover:bg-gray-50 transition flex justify-between items-center gap-2">
                                <div className="flex flex-col min-w-0">
                                    <span className="font-bold text-xs text-gray-800 font-mono truncate">{pkg.gmcTrackingNumber}</span>
                                    <span className="text-[10px] text-gray-500 line-clamp-1">{pkg.description || 'Sin descripción'}</span>
                                </div>
                                <span className="text-[9px] font-mono text-gray-400 shrink-0">{pkg.carrierTrackingNumber || 'GMC'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mb-6">
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2 flex items-center gap-1.5"><Camera size={16} className="text-blue-500"/> 1. Tomar Foto</label>
                {!photoUrl ? (
                    <label className="w-full h-40 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition active:scale-[0.98]">
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} disabled={uploading}/>
                        {uploading ? <Loader2 className="animate-spin text-blue-600 mb-2" size={32}/> : <Camera size={36} className="text-gray-400 mb-2"/>}
                        <span className="text-sm font-bold text-gray-500">{uploading ? 'Subiendo foto...' : 'Toque para abrir la cámara'}</span>
                    </label>
                ) : (
                    <div className="relative w-full h-48 rounded-xl overflow-hidden shadow-sm border border-gray-200">
                        <Image src={photoUrl} alt="Evidencia" fill className="object-cover"/>
                        <button onClick={() => setPhotoUrl('')} className="absolute top-2 right-2 bg-red-500/90 backdrop-blur-sm text-white p-2.5 rounded-full shadow-lg hover:bg-red-600 active:scale-90 transition">
                            <ArrowLeft size={16}/>
                        </button>
                    </div>
                )}
            </div>

            <div className="mb-8">
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2 flex items-center gap-1.5"><PenTool size={16} className="text-purple-500"/> 2. Firma del Cliente</label>
                <div className="border border-gray-300 rounded-xl bg-gray-50 overflow-hidden shadow-inner touch-none">
                    <SignatureCanvas ref={sigPad} penColor="#1e2330" canvasProps={{width: 320, height: 160, className: 'sigCanvas w-full'}} />
                </div>
                <div className="flex justify-end mt-2">
                    <button onClick={() => sigPad.current.clear()} className="text-[11px] text-red-500 font-bold uppercase tracking-widest bg-red-50 px-3 py-1 rounded-md border border-red-100">Borrar Firma</button>
                </div>
            </div>

            <button onClick={handleCompleteDelivery} disabled={loading || !photoUrl} className={`w-full py-4 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 transition-all active:scale-[0.98] ${loading || !photoUrl ? 'bg-gray-300 text-gray-500' : 'bg-[#1e2330] text-white hover:bg-black'}`}>
                {loading ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle size={20}/>}
                {loading ? 'GUARDANDO EVIDENCIA...' : 'FINALIZAR ENTREGA'}
            </button>
          </div>
      </div>
    </div>
  );
}