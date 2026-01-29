"use client";

import React, { useState } from 'react';
import { Camera, Phone, CheckCircle, Navigation, Package, UploadCloud, Warehouse, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface DriverTaskProps {
  task: any; 
}

export default function DriverTaskClient({ task }: DriverTaskProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  
  // Sincronizamos estado local con props iniciales
  const [pickupPhoto, setPickupPhoto] = useState<string | null>(task.photoPickupUrl);
  // Delivery photo puede venir del campo photoDeliveryUrl
  const [deliveryPhoto, setDeliveryPhoto] = useState<string | null>(task.photoDeliveryUrl);
  
  // Calculamos si la tarea está completada basándonos en el status
  const isPickupDone = !!pickupPhoto || task.status === 'EN_REPARTO' || task.status === 'ENTREGADO' || task.status === 'COMPLETADO';
  const isDeliveryDone = task.status === 'ENTREGADO' || task.status === 'COMPLETADO';

  // Saber si requiere foto final (Solo si es Delivery Local)
  // NOTA: Asumimos que si hay dropOffAddress, es local.
  const isLocalDelivery = !!task.dropOffAddress;

  const handleProcess = async (e: React.ChangeEvent<HTMLInputElement> | null, action: 'PICKUP' | 'DELIVERY') => {
    const file = e?.target.files?.[0];
    
    // Validación: Pickup siempre necesita archivo
    if (action === 'PICKUP' && !file) return;
    // Validación: Delivery Local siempre necesita archivo
    if (action === 'DELIVERY' && isLocalDelivery && !file) return;

    setIsUploading(true);
    try {
        let finalPhotoUrl = null;

        // 1. Convertir imagen a Base64 (Para enviarla a nuestra API y que ella se encargue)
        // Esto evita depender de Cloudinary en el cliente si no está configurado
        if (file) {
             const reader = new FileReader();
             finalPhotoUrl = await new Promise<string>((resolve) => {
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
             });
        }

        // 2. Determinar API correcta (La blindada)
        const endpoint = action === 'PICKUP' 
            ? '/api/driver/complete-pickup' 
            : '/api/driver/complete-delivery';
            
        const body = action === 'PICKUP' 
            ? { pickupId: task.id, photoUrl: finalPhotoUrl }
            : { packageId: task.id, photoUrl: finalPhotoUrl, signatureBase64: null };

        console.log(`🚀 Enviando a ${endpoint}...`);

        const apiRes = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await apiRes.json();

        if (!apiRes.ok) throw new Error(data.error || "Error actualizando estado");

        // 3. Actualizar UI
        if (action === 'PICKUP') {
            setPickupPhoto(finalPhotoUrl);
            alert("✅ Recogida registrada. ¡En camino!");
        } else {
            setDeliveryPhoto(finalPhotoUrl || 'done');
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
      window.open(`https://waze.com/ul?q=${encodeURIComponent(address)}`, '_blank');
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen pb-20 font-sans">
      
      {/* HEADER */}
      <div className="bg-[#222b3c] text-white p-6 rounded-b-3xl shadow-lg mb-6 sticky top-0 z-10">
        <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold font-serif">Tarea #{task.id.slice(0,6).toUpperCase()}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${isDeliveryDone ? 'bg-green-500' : 'bg-blue-500'}`}>
                {isDeliveryDone ? 'COMPLETADO' : (isPickupDone ? 'EN REPARTO' : 'PENDIENTE')}
            </span>
        </div>
        <div className="mt-4 flex items-center gap-3 bg-white/10 p-3 rounded-xl">
            <div className="bg-yellow-500 p-2 rounded-full text-black"><Package size={20}/></div>
            <div>
                <p className="text-xs text-gray-300 uppercase">Cliente</p>
                <p className="font-bold">{task.user?.name || 'Cliente'}</p>
                {task.contactPhone && (
                    <a href={`tel:${task.contactPhone}`} className="text-xs text-blue-300 underline flex items-center gap-1 mt-1"><Phone size={10}/> {task.contactPhone}</a>
                )}
            </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        
        {/* --- PASO A: RECOGIDA --- */}
        <div className={`bg-white p-5 rounded-2xl shadow-sm border-l-4 ${isPickupDone ? 'border-green-500 opacity-80' : 'border-blue-500'}`}>
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${isPickupDone ? 'bg-green-500' : 'bg-blue-600'}`}>1</div> 
                    Recogida
                </h3>
                <button onClick={() => openMap(task.originAddress)} className="text-blue-600 bg-blue-50 p-2 rounded-full hover:bg-blue-100"><Navigation size={18}/></button>
            </div>
            <p className="text-gray-600 text-sm mb-4 pl-8">{task.originAddress}</p>
            
            <div className="pl-8">
                {isPickupDone ? (
                    <div className="relative h-32 w-full rounded-lg overflow-hidden border border-green-200 bg-gray-100 flex items-center justify-center">
                        {pickupPhoto ? (
                             <img src={pickupPhoto} alt="Pickup" className="w-full h-full object-cover" />
                        ) : <CheckCircle className="text-green-500" size={40} />}
                        
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold gap-2"><CheckCircle size={20}/> Completado</div>
                    </div>
                ) : (
                    <label className={`w-full py-4 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 flex flex-col items-center justify-center cursor-pointer transition-all ${isUploading ? 'opacity-50' : 'active:scale-95'}`}>
                        {isUploading ? <Loader2 className="animate-spin mb-1 text-blue-500"/> : <Camera size={28} className="mb-1 text-blue-600"/>}
                        <span className="text-sm font-bold text-blue-700">{isUploading ? "Procesando..." : "Foto de Recogida"}</span>
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleProcess(e, 'PICKUP')} disabled={isUploading} />
                    </label>
                )}
            </div>
        </div>

        {/* --- PASO B: ENTREGA --- */}
        <div className={`bg-white p-5 rounded-2xl shadow-sm border-l-4 ${isDeliveryDone ? 'border-green-500' : 'border-gray-300'} ${!isPickupDone ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${isDeliveryDone ? 'bg-green-500' : 'bg-gray-400'}`}>2</div> 
                    Entrega
                </h3>
                <button onClick={() => openMap(task.dropOffAddress || '1861 NW 22nd St, Miami, FL')} className="text-green-600 bg-green-50 p-2 rounded-full hover:bg-green-100"><Navigation size={18}/></button>
            </div>
            
            <p className="text-gray-600 text-sm mb-4 pl-8">
                {task.dropOffAddress || 'Almacén Central GMC'}
            </p>

            <div className="pl-8">
                {isDeliveryDone ? (
                     <div className="w-full py-4 rounded-lg bg-green-100 text-green-800 font-bold text-center border border-green-200 flex items-center justify-center gap-2">
                        <CheckCircle size={20}/> TAREA FINALIZADA
                    </div>
                ) : (
                    isLocalDelivery ? (
                        // Opción A: DELIVERY LOCAL (Pide Foto)
                        <label className="w-full py-4 rounded-xl border-2 border-dashed border-green-300 bg-green-50 flex flex-col items-center justify-center cursor-pointer hover:bg-green-100 transition-all">
                            {isUploading ? <Loader2 className="animate-spin mb-1 text-green-600"/> : <Camera size={28} className="mb-1 text-green-600"/>}
                            <span className="text-sm font-bold text-green-700">{isUploading ? "Enviando..." : "Foto de Entrega"}</span>
                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleProcess(e, 'DELIVERY')} disabled={isUploading} />
                        </label>
                    ) : (
                        // Opción B: ENVÍO/STORAGE (Botón simple, sin foto obligatoria para almacén)
                        <button 
                            onClick={() => handleProcess(null, 'DELIVERY')}
                            disabled={isUploading}
                            className="w-full py-4 rounded-xl bg-[#222b3c] text-white font-bold flex flex-col items-center justify-center shadow-md active:scale-95 transition-all"
                        >
                            {isUploading ? <Loader2 className="animate-spin mb-1"/> : <Warehouse size={28} className="mb-1 text-yellow-500"/>}
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