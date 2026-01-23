"use client";

import React, { useState } from 'react';
import { X, Save, Upload, Ruler, Scale, Camera, DollarSign, FileText } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface EditPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: any; // El objeto del paquete que vas a editar
}

export default function EditPackageAdminModal({ isOpen, onClose, pkg }: EditPackageModalProps) {
  const router = useRouter();
  
  // Agregamos declaredValue y description al estado único formData
  const [formData, setFormData] = useState({
    weight: pkg.weightLbs || '',
    length: pkg.lengthIn || '',
    width: pkg.widthIn || '',
    height: pkg.heightIn || '',
    // 🔥 NUEVOS DATOS
    declaredValue: pkg.declaredValue || '',
    description: pkg.description || ''
  });

  const [photoUrl, setPhotoUrl] = useState(pkg.photoUrlMiami || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  // 1. Manejo de Subida de Foto (Igual que en el cliente, pero para Admin)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; 
    if (!file) return; 
    
    setIsUploading(true);
    try {
      const fd = new FormData(); 
      fd.append('file', file); 
      fd.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default');
      
      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      
      if (data.secure_url) {
        setPhotoUrl(data.secure_url);
      }
    } catch (e) { alert("Error al subir imagen"); } 
    finally { setIsUploading(false); }
  };

  // 2. Guardar Cambios
  const handleSave = async () => {
    setIsSaving(true);
    try {
        const res = await fetch('/api/packages/admin-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                packageId: pkg.id,
                weight: formData.weight,
                length: formData.length,
                width: formData.width,
                height: formData.height,
                photoUrl: photoUrl,
                // 🔥 ENVIAMOS LOS NUEVOS DATOS AL BACKEND
                declaredValue: parseFloat(formData.declaredValue) || 0,
                description: formData.description
            })
        });

        if (res.ok) {
            alert("✅ Paquete corregido con éxito");
            router.refresh(); // Refresca la página para ver los cambios
            onClose();
        } else {
            alert("Error al guardar cambios");
        }
    } catch (e) {
        console.error(e);
        alert("Error de conexión");
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 font-montserrat">
        
        {/* Header */}
        <div className="bg-[#222b3c] p-4 flex justify-between items-center text-white">
            <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="text-yellow-400">⚡</span> Corregir Paquete: {pkg.trackingNumber || pkg.gmcTrackingNumber}
            </h3>
            <button onClick={onClose}><X className="hover:text-red-400 transition"/></button>
        </div>

        <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
            
            {/* Sección de Foto */}
            <div className="flex gap-4 items-start">
                <div className="relative w-32 h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {photoUrl ? (
                        <Image src={photoUrl} alt="Evidence" fill className="object-cover" />
                    ) : (
                        <Camera className="text-gray-400" />
                    )}
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Evidencia Fotográfica</label>
                    <div className="text-xs text-gray-500 mb-3">Si el almacén olvidó la foto o está borrosa, sube una nueva aquí.</div>
                    <label className="cursor-pointer bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-100 flex items-center gap-2 w-max transition">
                        <Upload size={16}/> {isUploading ? "Subiendo..." : "Subir Nueva Foto"}
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={isUploading}/>
                    </label>
                </div>
            </div>

            <hr className="border-gray-100"/>

            {/* Sección de Medidas y Peso */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Scale size={12}/> Peso (Lbs)</label>
                    <input 
                        type="number" 
                        value={formData.weight}
                        onChange={e => setFormData({...formData, weight: e.target.value})}
                        className="w-full p-2 border rounded-lg font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                     {/* Espacio vacío usado para equilibrio visual */}
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Ruler size={12}/> Dimensiones (L x W x H)</label>
                <div className="flex gap-2">
                    <input type="number" placeholder="L" value={formData.length} onChange={e => setFormData({...formData, length: e.target.value})} className="w-full p-2 border rounded-lg text-center"/>
                    <span className="self-center text-gray-400">x</span>
                    <input type="number" placeholder="W" value={formData.width} onChange={e => setFormData({...formData, width: e.target.value})} className="w-full p-2 border rounded-lg text-center"/>
                    <span className="self-center text-gray-400">x</span>
                    <input type="number" placeholder="H" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="w-full p-2 border rounded-lg text-center"/>
                </div>
            </div>

            <hr className="border-gray-100"/>

            {/* 🔥 SECCIÓN DE DATOS DE RECEPCIÓN (VALOR Y DESCRIPCIÓN) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div className="col-span-1">
                    <label className="block text-xs font-bold text-blue-600 uppercase mb-1 flex items-center gap-1">
                        <DollarSign size={12}/> Valor Declarado ($)
                    </label>
                    <input 
                        type="number" 
                        placeholder="0.00"
                        value={formData.declaredValue} 
                        onChange={e => setFormData({...formData, declaredValue: e.target.value})}
                        className="w-full p-2 border border-blue-200 bg-white rounded-lg font-bold text-blue-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <p className="text-[10px] text-gray-400 mt-1 ml-1">+ Seguro (3%) si {'>'} $100</p>
                </div>
                <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                        <FileText size={12}/> Descripción
                    </label>
                    <textarea 
                        placeholder="Ej: Ropa, Zapatos..."
                        value={formData.description} 
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm h-[74px] resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            {/* Botón Guardar */}
            <button 
                onClick={handleSave}
                disabled={isSaving || isUploading}
                className="w-full bg-[#222b3c] text-white py-3 rounded-xl font-bold shadow-lg hover:bg-gray-800 transition flex justify-center items-center gap-2"
            >
                <Save size={18}/> {isSaving ? "Guardando..." : "Guardar Correcciones"}
            </button>

        </div>
      </div>
    </div>
  );
}