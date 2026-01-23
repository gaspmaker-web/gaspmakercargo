"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Camera, CheckCircle, Loader2, ArrowLeft, PenTool } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas'; 

export default function DriverDeliveryPage({ params }: { params: { id: string, locale: string } }) {
  const router = useRouter();
  const sigPad = useRef<any>(null);
  
  const [step, setStep] = useState(1);
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. Subir Foto a Cloudinary
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
        const data = new FormData();
        data.append('file', file);
        data.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default');
        const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { 
            method: 'POST', 
            body: data 
        });
        const json = await res.json();
        if (json.secure_url) setPhotoUrl(json.secure_url);
    } catch (error) { 
        alert("Error subiendo foto"); 
    } finally { 
        setUploading(false); 
    }
  };

  // 2. Finalizar Entrega (Método Blindado 🛡️)
  const handleCompleteDelivery = async () => {
    if (!photoUrl) return alert("📸 La foto es obligatoria.");
    if (sigPad.current?.isEmpty()) return alert("✍️ La firma es obligatoria.");

    setLoading(true);
    
    // 👇 CAMBIO CRÍTICO: Usamos toDataURL() directo.
    // Esto evita el error de la librería 'trim-canvas' rota.
    // Guardará la firma tal cual la ves en pantalla.
    const signatureData = sigPad.current.toDataURL(); 

    try {
        const res = await fetch('/api/driver/complete-delivery', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                packageId: params.id,
                photoUrl: photoUrl,
                signatureBase64: signatureData
            })
        });

        if (res.ok) {
            setStep(3); // Mostrar pantalla de éxito
            setTimeout(() => {
                router.push(`/${params.locale}/dashboard-driver`);
                router.refresh();
            }, 3000);
        } else {
            const err = await res.json();
            alert("Error al guardar: " + (err.error || "Desconocido"));
        }
    } catch (e) { 
        alert("Error de conexión"); 
    } finally { 
        setLoading(false); 
    }
  };

  if (step === 3) {
      return (
          <div className="min-h-screen bg-green-600 flex flex-col items-center justify-center text-white p-6 animate-in fade-in">
              <CheckCircle size={80} className="mb-4 text-white"/>
              <h1 className="text-3xl font-bold mb-2 uppercase italic">¡Entrega Exitosa!</h1>
              <p>El paquete ha sido registrado como entregado.</p>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans pb-10">
      <button onClick={() => router.back()} className="flex items-center text-gray-500 mb-6 font-bold">
        <ArrowLeft size={20}/> Cancelar
      </button>
      
      <div className="bg-white p-6 rounded-2xl shadow-lg max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 uppercase italic">Confirmar Entrega</h1>

        {/* 1. SECCIÓN DE FOTO */}
        <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                <Camera size={14}/> 1. Foto de Evidencia
            </label>
            {!photoUrl ? (
                <label className="w-full h-40 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-gray-50 cursor-pointer active:bg-gray-100 transition">
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} disabled={uploading}/>
                    {uploading ? <Loader2 className="animate-spin text-blue-600"/> : <Camera size={32} className="text-gray-400 mb-2"/>}
                    <span className="text-sm font-bold text-gray-400">Capturar Foto</span>
                </label>
            ) : (
                <div className="relative h-48 w-full rounded-xl overflow-hidden border border-gray-200 shadow-md">
                    <Image src={photoUrl} alt="Evidencia" fill className="object-cover"/>
                    <button onClick={() => setPhotoUrl('')} className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-lg">
                        <ArrowLeft size={16}/>
                    </button>
                </div>
            )}
        </div>

        {/* 2. SECCIÓN DE FIRMA */}
        <div className="mb-8">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                <PenTool size={14}/> 2. Firma del Cliente
            </label>
            <div className="border-2 border-gray-200 rounded-xl bg-white overflow-hidden touch-none shadow-inner">
                <SignatureCanvas 
                    ref={sigPad}
                    penColor="black"
                    canvasProps={{width: 320, height: 160, className: 'sigCanvas'}} 
                />
            </div>
            <button onClick={() => sigPad.current.clear()} className="text-xs text-red-500 font-bold mt-2 underline italic">
                Limpiar Firma
            </button>
        </div>

        <button 
            onClick={handleCompleteDelivery}
            disabled={loading || !photoUrl}
            className="w-full bg-[#222b3c] text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-black disabled:opacity-50 flex justify-center items-center gap-2"
        >
            {loading ? <Loader2 className="animate-spin"/> : <CheckCircle size={22}/>}
            {loading ? 'PROCESANDO...' : 'FINALIZAR ENTREGA'}
        </button>
      </div>
    </div>
  );
}