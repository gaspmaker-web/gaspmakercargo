"use client";

import React, { useState } from 'react';
import { Camera, MapPin, Phone, CheckCircle, Navigation, Package, UploadCloud, Warehouse, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface DriverTaskProps {
  task: any; 
}

export default function DriverTaskClient({ task }: DriverTaskProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  
  const [pickupPhoto, setPickupPhoto] = useState<string | null>(task.photoPickupUrl);
  const [deliveryPhoto, setDeliveryPhoto] = useState<string | null>(task.photoDeliveryUrl);
  const [currentStatus, setCurrentStatus] = useState(task.status);

  // Saber si requiere foto final (Solo si es Delivery Local)
  const isLocalDelivery = task.serviceType === 'DELIVERY';

  const handleProcess = async (e: React.ChangeEvent<HTMLInputElement> | null, action: 'PICKUP' | 'DELIVERY') => {
    // Si hay evento (e), es subida de foto. Si es null, es confirmación simple.
    const file = e?.target.files?.[0];
    
    // Validación: Pickup siempre necesita archivo
    if (action === 'PICKUP' && !file) return;
    // Validación: Delivery Local siempre necesita archivo
    if (action === 'DELIVERY' && isLocalDelivery && !file) return;

    setIsUploading(true);
    try {
        let finalPhotoUrl = null;

        // 1. Subir foto (Solo si hay archivo)
        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default');

            const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: 'POST', body: formData
            });
            const cloudData = await cloudRes.json();
            if (!cloudData.secure_url) throw new Error("Error subiendo imagen");
            finalPhotoUrl = cloudData.secure_url;
        }

        // 2. Actualizar Estado (API)
        const apiRes = await fetch('/api/driver/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requestId: task.id,
                action: action,
                photoUrl: finalPhotoUrl // Puede ser null si es entrega en almacén
            })
        });

        if (!apiRes.ok) throw new Error("Error actualizando estado");

        // 3. Actualizar UI
        if (action === 'PICKUP') {
            setPickupPhoto(finalPhotoUrl);
            setCurrentStatus('EN_CAMINO');
            alert("✅ Recogida registrada. ¡En camino!");
        } else {
            if(finalPhotoUrl) setDeliveryPhoto(finalPhotoUrl);
            setCurrentStatus('COMPLETADO');
            alert(isLocalDelivery ? "✅ Entrega confirmada con foto." : "✅ Paquete entregado en almacén.");
        }
        
        router.refresh();

    } catch (error) {
        console.error(error);
        alert("Ocurrió un error. Intenta de nuevo.");
    } finally {
        setIsUploading(false);
    }
  };

  const openMap = (address: string) => {
      window.open(`http://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank');
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen pb-20 font-sans">
      
      {/* HEADER */}
      <div className="bg-gmc-gris-oscuro text-white p-6 rounded-b-3xl shadow-lg mb-6 sticky top-0 z-10">
        <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold font-garamond">Tarea #{task.id.slice(0,6).toUpperCase()}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${currentStatus === 'COMPLETADO' ? 'bg-green-500' : 'bg-blue-500'}`}>
                {currentStatus.replace('_', ' ')}
            </span>
        </div>
        <div className="mt-4 flex items-center gap-3 bg-white/10 p-3 rounded-xl">
            <div className="bg-gmc-dorado-principal p-2 rounded-full text-black"><Package size={20}/></div>
            <div>
                <p className="text-xs text-gray-300 uppercase">Cliente</p>
                <p className="font-bold">{task.user.name}</p>
                <a href={`tel:${task.contactPhone}`} className="text-xs text-blue-300 underline flex items-center gap-1 mt-1"><Phone size={10}/> {task.contactPhone}</a>
            </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        
        {/* --- PASO A: RECOGIDA (SIEMPRE IGUAL) --- */}
        <div className={`bg-white p-5 rounded-2xl shadow-sm border-l-4 ${pickupPhoto ? 'border-green-500 opacity-80' : 'border-blue-500'}`}>
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">A</div> Recogida</h3>
                <button onClick={() => openMap(task.originAddress)} className="text-blue-600 bg-blue-50 p-2 rounded-full hover:bg-blue-100"><Navigation size={18}/></button>
            </div>
            <p className="text-gray-600 text-sm mb-4 pl-8">{task.originAddress}</p>
            
            <div className="pl-8">
                {pickupPhoto ? (
                    <div className="relative h-32 w-full rounded-lg overflow-hidden border border-green-200">
                        <Image src={pickupPhoto} alt="Pickup" layout="fill" objectFit="cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold gap-2"><CheckCircle size={20}/> Recogido</div>
                    </div>
                ) : (
                    <label className={`w-full py-4 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 flex flex-col items-center justify-center cursor-pointer transition-all ${isUploading ? 'opacity-50' : 'active:scale-95'}`}>
                        {isUploading ? <UploadCloud className="animate-bounce mb-1 text-blue-500"/> : <Camera size={28} className="mb-1 text-blue-600"/>}
                        <span className="text-sm font-bold text-blue-700">{isUploading ? "Subiendo..." : "Foto de Recogida"}</span>
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleProcess(e, 'PICKUP')} disabled={isUploading} />
                    </label>
                )}
            </div>
        </div>

        {/* --- PASO B: ENTREGA (CONDICIONAL) --- */}
        <div className={`bg-white p-5 rounded-2xl shadow-sm border-l-4 ${currentStatus === 'COMPLETADO' ? 'border-green-500' : 'border-gray-300'} ${!pickupPhoto ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><div className="w-6 h-6 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-xs">B</div> Entrega</h3>
                {/* Si es local, mostramos mapa al destino. Si es almacén, mapa al almacén. */}
                <button onClick={() => openMap(task.dropOffAddress || '1861 NW 22nd St, Miami, FL')} className="text-green-600 bg-green-50 p-2 rounded-full hover:bg-green-100"><Navigation size={18}/></button>
            </div>
            
            <p className="text-gray-600 text-sm mb-4 pl-8">
                {isLocalDelivery ? task.dropOffAddress : 'Almacén Central GMC'}
            </p>

            <div className="pl-8">
                {currentStatus === 'COMPLETADO' ? (
                     <div className="w-full py-4 rounded-lg bg-green-100 text-green-800 font-bold text-center border border-green-200 flex items-center justify-center gap-2">
                        <CheckCircle size={20}/> TAREA FINALIZADA
                    </div>
                ) : (
                    // --- AQUÍ ESTÁ LA LÓGICA DIFERENCIADA ---
                    isLocalDelivery ? (
                        // Opción A: DELIVERY LOCAL (Pide Foto)
                        <label className="w-full py-4 rounded-xl border-2 border-dashed border-green-300 bg-green-50 flex flex-col items-center justify-center cursor-pointer hover:bg-green-100 transition-all">
                            <Camera size={28} className="mb-1 text-green-600"/>
                            <span className="text-sm font-bold text-green-700">Tomar Foto de Entrega</span>
                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleProcess(e, 'DELIVERY')} disabled={isUploading} />
                        </label>
                    ) : (
                        // Opción B: ENVÍO/STORAGE (Botón simple)
                        <button 
                            onClick={() => handleProcess(null, 'DELIVERY')}
                            disabled={isUploading}
                            className="w-full py-4 rounded-xl bg-gmc-gris-oscuro text-white font-bold flex flex-col items-center justify-center shadow-md active:scale-95 transition-all"
                        >
                            <Warehouse size={28} className="mb-1 text-gmc-dorado-principal"/>
                            <span className="text-sm">Confirmar Llegada a Almacén</span>
                        </button>
                    )
                )}
            </div>
        </div>

      </div>
    </div>
  );
}