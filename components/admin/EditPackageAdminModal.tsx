"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, Upload, Ruler, Scale, Camera, DollarSign, Globe, Plus, Trash2, Loader2, UploadCloud, CheckCircle, FileText } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface EditPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: any; 
}

export default function EditPackageAdminModal({ isOpen, onClose, pkg }: EditPackageModalProps) {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    weight: pkg.weightLbs || '',
    length: pkg.lengthIn || '',
    width: pkg.widthIn || '',
    height: pkg.heightIn || '',
    declaredValue: pkg.declaredValue || '',
    description: pkg.description || ''
  });

  const [photoUrl, setPhotoUrl] = useState(pkg.photoUrlMiami || '');
  const [invoiceUrl, setInvoiceUrl] = useState(pkg.invoiceUrl || ''); // 🔥 NUEVO ESTADO PARA FACTURA
  
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingInvoice, setIsUploadingInvoice] = useState(false); // 🔥 ESTADO DE CARGA FACTURA
  const [isSaving, setIsSaving] = useState(false);

  // ========================================================================
  // 🔥 ESTADO PARA LA TABLA DE ADUANAS
  // ========================================================================
  const [customsItems, setCustomsItems] = useState<any[]>(() => {
      if (pkg.customsItems && Array.isArray(pkg.customsItems) && pkg.customsItems.length > 0) {
          return pkg.customsItems;
      }
      return [{ 
          qty: 1, 
          description: pkg.description || '', 
          value: pkg.declaredValue || '' 
      }];
  });

  const addCustomsItem = () => {
      setCustomsItems([...customsItems, { qty: 1, description: '', value: '' }]);
  };

  const removeCustomsItem = (index: number) => {
      if (customsItems.length > 1) {
          const newItems = customsItems.filter((_, i) => i !== index);
          setCustomsItems(newItems);
          recalculateTotalValue(newItems);
      }
  };

  const updateCustomsItem = (index: number, field: string, val: any) => {
      const newItems = [...customsItems];
      newItems[index] = { ...newItems[index], [field]: val };
      setCustomsItems(newItems);
      
      if (field === 'value' || field === 'qty') {
          recalculateTotalValue(newItems);
      }
  };

  const recalculateTotalValue = (items: any[]) => {
      const total = items.reduce((acc, item) => acc + (Number(item.qty) * Number(item.value || 0)), 0);
      setFormData(prev => ({ ...prev, declaredValue: total.toFixed(2) }));
  };
  // ========================================================================

  if (!isOpen) return null;

  // 📸 SUBIR FOTO DEL PAQUETE
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
      
      if (data.secure_url) setPhotoUrl(data.secure_url);
    } catch (e) { alert("Error al subir imagen"); } 
    finally { setIsUploading(false); }
  };

  // 📄 SUBIR FACTURA
  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; 
    if (!file) return; 
    
    setIsUploadingInvoice(true);
    try {
      const fd = new FormData(); 
      fd.append('file', file); 
      fd.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default');
      
      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      
      if (data.secure_url) setInvoiceUrl(data.secure_url);
    } catch (e) { alert("Error al subir factura"); } 
    finally { setIsUploadingInvoice(false); }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const combinedDescription = customsItems.map(item => `${item.qty}x ${item.description}`).join(', ');

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
                invoiceUrl: invoiceUrl, // 🔥 ENVIAMOS LA FACTURA AL BACKEND
                declaredValue: parseFloat(formData.declaredValue) || 0,
                description: combinedDescription, 
                customsItems: customsItems        
            })
        });

        if (res.ok) {
            alert("✅ Paquete corregido con éxito");
            router.refresh(); 
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
        
        <div className="bg-[#222b3c] p-4 flex justify-between items-center text-white">
            <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="text-yellow-400">⚡</span> Corregir Paquete: {pkg.trackingNumber || pkg.gmcTrackingNumber}
            </h3>
            <button onClick={onClose}><X className="hover:text-red-400 transition"/></button>
        </div>

        <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
            
            {/* 📦 SECCIÓN 1: ARCHIVOS (FOTO Y FACTURA) */}
            <div className="grid grid-cols-2 gap-4">
                {/* Caja de Foto del Paquete */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col items-center">
                    <label className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1 uppercase tracking-wider">
                        <Camera size={14}/> Foto del Paquete
                    </label>
                    <div className="relative w-full h-24 bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden mb-2">
                        {photoUrl ? (
                            <Image src={photoUrl} alt="Evidence" fill className="object-cover" />
                        ) : (
                            <Camera className="text-gray-300" size={30}/>
                        )}
                    </div>
                    <label className="cursor-pointer bg-blue-50 text-blue-700 w-full text-center py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition">
                        {isUploading ? "Subiendo..." : "Cambiar Foto"}
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={isUploading}/>
                    </label>
                </div>

                {/* Caja de Factura Comercial */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex flex-col items-center">
                    <label className="text-xs font-bold text-yellow-700 mb-2 flex items-center gap-1 uppercase tracking-wider">
                        <FileText size={14}/> Factura (Invoice)
                    </label>
                    <label className={`
                        relative w-full h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition
                        ${invoiceUrl ? 'border-green-400 bg-green-50' : 'border-yellow-300 bg-white hover:bg-yellow-100'}
                    `}>
                        {invoiceUrl ? (
                            <div className="text-center">
                                <CheckCircle className="text-green-500 mx-auto mb-1" size={24}/>
                                <span className="text-[10px] font-bold text-green-700">Factura Subida</span>
                            </div>
                        ) : (
                            <div className="text-center text-yellow-600">
                                {isUploadingInvoice ? <Loader2 className="animate-spin mx-auto mb-1" size={24}/> : <UploadCloud className="mx-auto mb-1" size={24}/>}
                                <span className="text-[10px] font-bold">Subir Archivo</span>
                            </div>
                        )}
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleInvoiceUpload} disabled={isUploadingInvoice}/>
                    </label>
                    {invoiceUrl && (
                        <button onClick={() => setInvoiceUrl('')} className="mt-2 text-[10px] text-red-500 hover:underline">
                            Remover Factura
                        </button>
                    )}
                </div>
            </div>

            <hr className="border-gray-100"/>

            {/* ⚖️ SECCIÓN 2: MEDIDAS FÍSICAS */}
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

            {/* 🌐 SECCIÓN 3: TABLA DE ADUANAS */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <Globe size={16} className="text-blue-500" /> Declaración Comercial
                    </label>
                    <div className="text-xs font-bold text-blue-800 bg-blue-100 px-3 py-1 rounded-md flex items-center gap-1">
                        Total: <DollarSign size={12}/>{formData.declaredValue || '0.00'}
                    </div>
                </div>
                
                <div className="flex gap-2 text-[10px] font-bold text-slate-500 uppercase mb-2 px-1">
                    <div className="w-14 text-center">Cant.</div>
                    <div className="flex-1">Descripción</div>
                    <div className="w-20 text-center">V. Unit</div>
                    <div className="w-8"></div>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {customsItems.map((item, index) => (
                        <div key={index} className="flex gap-2 items-start animate-fadeIn">
                            <input 
                                type="number" min="1" 
                                value={item.qty} 
                                onChange={e => updateCustomsItem(index, 'qty', e.target.value)} 
                                className="w-14 h-10 border border-slate-300 rounded-lg text-center font-bold text-sm focus:border-blue-500 outline-none" 
                            />
                            <input 
                                type="text" 
                                value={item.description} 
                                onChange={e => updateCustomsItem(index, 'description', e.target.value)} 
                                className="flex-1 h-10 px-2 border border-slate-300 rounded-lg text-sm focus:border-blue-500 outline-none" 
                                placeholder="Ej: Zapatos" 
                            />
                            <div className="relative w-20">
                                <DollarSign className="absolute left-1 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                                <input 
                                    type="number" step="0.01" min="0"
                                    value={item.value} 
                                    onChange={e => updateCustomsItem(index, 'value', e.target.value)} 
                                    className="w-full h-10 pl-5 pr-1 border border-slate-300 rounded-lg font-mono text-sm focus:border-blue-500 outline-none" 
                                    placeholder="0.00" 
                                />
                            </div>
                            <button 
                                type="button" 
                                onClick={() => removeCustomsItem(index)} 
                                className="h-10 w-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                <button 
                    type="button" 
                    onClick={addCustomsItem} 
                    className="mt-3 text-sm font-bold text-blue-600 flex items-center gap-1 hover:text-blue-800 transition-colors"
                >
                    <Plus size={16} /> Añadir Artículo
                </button>
            </div>

            {/* BOTÓN DE GUARDAR */}
            <button 
                onClick={handleSave}
                disabled={isSaving || isUploading || isUploadingInvoice}
                className="w-full bg-[#222b3c] text-white py-4 rounded-xl font-bold shadow-lg hover:bg-gray-800 transition flex justify-center items-center gap-2 mt-4"
            >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18}/>} 
                {isSaving ? "Guardando..." : "Guardar Correcciones"}
            </button>

        </div>
      </div>
    </div>
  );
}