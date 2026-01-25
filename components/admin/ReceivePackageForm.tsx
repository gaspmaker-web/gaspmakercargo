"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Scale, Save, Loader2, Info, Camera, X, Ruler, FileText, UploadCloud, CheckCircle, Truck, DollarSign, User } from 'lucide-react';
import Image from 'next/image';

interface ReceivePackageFormProps {
  pkg: any; // Recibimos el objeto completo del paquete
}

export default function ReceivePackageForm({ pkg }: ReceivePackageFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Estados de carga independientes
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingInvoice, setUploadingInvoice] = useState(false);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    weightLbs: pkg.weightLbs || '',
    lengthIn: pkg.lengthIn || '',
    widthIn: pkg.widthIn || '',
    heightIn: pkg.heightIn || '',
    description: pkg.description || '',
    photoUrlMiami: pkg.photoUrlMiami || '', // Foto del paquete
    invoiceUrl: pkg.invoiceUrl || ''        // Foto de la factura
  });

  // Función genérica para subir a Cloudinary
  const uploadToCloudinary = async (file: File) => {
    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default');
    
    const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: data
    });
    return await res.json();
  };

  // 1. Subir Foto del Paquete
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
        const json = await uploadToCloudinary(file);
        if (json.secure_url) {
            setFormData(prev => ({ ...prev, photoUrlMiami: json.secure_url }));
        }
    } catch (error) {
        console.error("Error subiendo foto", error);
        alert("Error al subir la imagen.");
    } finally {
        setUploadingPhoto(false);
    }
  };

  // 2. Subir Factura
  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingInvoice(true);
    try {
        const json = await uploadToCloudinary(file);
        if (json.secure_url) {
            setFormData(prev => ({ ...prev, invoiceUrl: json.secure_url }));
        }
    } catch (error) {
        console.error("Error subiendo factura", error);
        alert("Error al subir la factura.");
    } finally {
        setUploadingInvoice(false);
    }
  };

  const handleReceive = async () => {
    // Validaciones básicas
    if (!formData.weightLbs || !formData.lengthIn || !formData.widthIn || !formData.heightIn) {
      alert("⚠️ Faltan datos físicos (Peso o Medidas).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/packages/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pkg.id,
          weightLbs: parseFloat(formData.weightLbs),
          lengthIn: parseFloat(formData.lengthIn),
          widthIn: parseFloat(formData.widthIn),
          heightIn: parseFloat(formData.heightIn),
          description: formData.description,
          photoUrlMiami: formData.photoUrlMiami, 
          invoiceUrl: formData.invoiceUrl,       
          status: 'RECIBIDO_MIAMI' 
        })
      });

      if (res.ok) {
        alert("✅ Paquete recibido y actualizado correctamente.");
        router.refresh(); 
        router.push('/dashboard-admin/paquetes'); 
      } else {
        const err = await res.json();
        alert("Error al guardar: " + err.message);
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* 1. INFORMACIÓN DE LA PRE-ALERTA */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-blue-900 font-bold flex items-center gap-2 mb-4 text-lg border-b border-blue-200 pb-2">
            <Info size={20} className="text-blue-600"/> Datos de la Pre-Alerta
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-blue-900">
             
             <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <User size={14} className="text-blue-400"/>
                    <div>
                        <p className="font-bold text-blue-500 uppercase text-[10px]">Cliente</p>
                        <p className="font-bold">{pkg.user?.name || 'N/A'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3.5 flex justify-center"><span className="text-blue-400 font-bold text-xs">#</span></div>
                    <div>
                        <p className="font-bold text-blue-500 uppercase text-[10px]">Casillero</p>
                        <p className="font-mono bg-blue-100 px-1 rounded inline-block text-xs">{pkg.user?.suiteNo || 'N/A'}</p>
                    </div>
                </div>
             </div>

             <div className="space-y-2 border-l border-blue-200 pl-0 md:pl-4">
                <div className="flex items-center gap-2">
                    <Truck size={14} className="text-blue-400"/>
                    <div>
                        <p className="font-bold text-blue-500 uppercase text-[10px]">Transportista (USA)</p>
                        <p className="font-bold uppercase text-blue-900">{pkg.courier || 'NO ESPECIFICADO'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <DollarSign size={14} className="text-green-500"/>
                    <div>
                        <p className="font-bold text-blue-500 uppercase text-[10px]">Valor Declarado</p>
                        <p className="font-bold text-green-700">${pkg.declaredValue ? pkg.declaredValue.toFixed(2) : '0.00'}</p>
                    </div>
                </div>
             </div>

             <div className="space-y-2 border-l border-blue-200 pl-0 md:pl-4">
                 <div>
                    <p className="font-bold text-blue-500 uppercase text-[10px] mb-1">Tracking Original (Carrier)</p>
                    <p className="font-mono bg-white px-2 py-1 rounded border border-blue-200 text-xs break-all select-all">
                        {pkg.carrierTrackingNumber || 'N/A'}
                    </p>
                 </div>
                 
                 {pkg.description && (
                     <div className="mt-2">
                        <p className="font-bold text-blue-500 uppercase text-[10px] mb-1">Nota del Cliente:</p>
                        <p className="text-xs text-gray-600 bg-white/50 p-1 rounded italic">"{pkg.description}"</p>
                     </div>
                 )}
                 
                 <p className="text-[9px] text-blue-300 text-right mt-2">Ref: {pkg.gmcTrackingNumber}</p>
             </div>
        </div>
      </div>

      {/* 2. AREA DE TRABAJO */}
      <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-gmc-dorado-principal">
        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
            <div className="bg-yellow-100 p-3 rounded-full text-yellow-700">
                <Package size={24} />
            </div>
            <div>
                <h3 className="text-xl font-bold text-gray-800">Recepción en Almacén</h3>
                <p className="text-sm text-gray-500">Confirma peso, medidas y evidencia fotográfica.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div className="space-y-6">
                <h4 className="font-bold text-gray-800 border-b pb-2 mb-4">📦 Datos Reales (Medidos)</h4>
                
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><Scale size={14}/> Peso (Libras)</label>
                    <div className="relative">
                        <input 
                            type="number" step="0.01"
                            value={formData.weightLbs}
                            onChange={e => setFormData({...formData, weightLbs: e.target.value})}
                            className="w-full pl-4 p-4 border border-gray-300 rounded-xl font-bold text-3xl text-gray-800 focus:ring-2 focus:ring-[#222b3c] outline-none"
                            placeholder="0.00"
                        />
                        <span className="absolute right-4 top-5 text-gray-400 font-bold text-sm">LB</span>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><Ruler size={14}/> Dimensiones (Pulgadas)</label>
                    <div className="flex gap-2 items-center">
                        <div className="flex-1">
                            <input type="number" placeholder="L" className="w-full p-3 border rounded-lg text-center font-bold text-lg" value={formData.lengthIn} onChange={e => setFormData({...formData, lengthIn: e.target.value})} />
                            <span className="text-[10px] text-gray-400 text-center block mt-1">Largo</span>
                        </div>
                        <span className="text-gray-300 text-xl">×</span>
                        <div className="flex-1">
                            <input type="number" placeholder="W" className="w-full p-3 border rounded-lg text-center font-bold text-lg" value={formData.widthIn} onChange={e => setFormData({...formData, widthIn: e.target.value})} />
                            <span className="text-[10px] text-gray-400 text-center block mt-1">Ancho</span>
                        </div>
                        <span className="text-gray-300 text-xl">×</span>
                        <div className="flex-1">
                            <input type="number" placeholder="H" className="w-full p-3 border rounded-lg text-center font-bold text-lg" value={formData.heightIn} onChange={e => setFormData({...formData, heightIn: e.target.value})} />
                            <span className="text-[10px] text-gray-400 text-center block mt-1">Alto</span>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Foto Evidencia (Paquete)</label>
                    {!formData.photoUrlMiami ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-xl h-40 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer relative group">
                            <input 
                                type="file" 
                                accept="image/*" 
                                capture="environment"
                                onChange={handlePhotoUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                disabled={uploadingPhoto}
                            />
                            {uploadingPhoto ? (
                                <Loader2 className="animate-spin text-gmc-dorado-principal" size={30}/>
                            ) : (
                                <>
                                    <Camera size={24} className="text-gray-400 mb-2"/>
                                    <span className="text-xs font-bold text-gray-600">Tomar Foto Paquete</span>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-md h-40 group">
                            <Image src={formData.photoUrlMiami} alt="Evidencia Almacén" fill className="object-cover"/>
                            <button 
                                onClick={() => setFormData({...formData, photoUrlMiami: ''})}
                                className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow-md hover:bg-red-700 z-20"
                            >
                                <X size={14}/>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                <h4 className="font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                    <FileText size={18}/> Documentación & Notas
                </h4>

                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                    <label className="block text-xs font-bold text-yellow-800 uppercase mb-2">Factura Comercial</label>
                    <p className="text-[11px] text-yellow-700 mb-3 leading-tight">
                        Si el driver trajo la factura física, súbela aquí.
                    </p>

                    <label className={`
                        flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all
                        ${formData.invoiceUrl ? 'border-green-400 bg-green-50' : 'border-yellow-300 bg-white hover:bg-yellow-50'}
                    `}>
                        {formData.invoiceUrl ? (
                            <div className="text-center animate-in zoom-in">
                                <CheckCircle className="mx-auto text-green-600 mb-2" size={32}/>
                                <span className="text-sm font-bold text-green-800">Factura Adjuntada</span>
                                <span className="text-[10px] text-green-600 block mt-1">Click para cambiar</span>
                            </div>
                        ) : (
                            <div className="text-center text-yellow-600">
                                {uploadingInvoice ? (
                                    <Loader2 className="mx-auto animate-spin mb-2" size={24}/>
                                ) : (
                                    <UploadCloud className="mx-auto mb-2" size={24}/>
                                )}
                                <span className="text-sm font-bold">Subir Factura</span>
                            </div>
                        )}
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleInvoiceUpload} disabled={uploadingInvoice}/>
                    </label>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><FileText size={14}/> Notas Internas</label>
                    <textarea 
                        rows={3}
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#222b3c] outline-none bg-gray-50"
                        placeholder="Ej: Caja llegó un poco golpeada..."
                    />
                </div>

                <div className="flex gap-2 items-start bg-green-50 p-3 rounded-lg border border-green-200 mt-4">
                    <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0"/>
                    <p className="text-[11px] text-green-800">
                        Se guardará como <strong>RECIBIDO_MIAMI</strong> para activar la opción de pago en el cliente.
                    </p>
                </div>
            </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
            <button 
                onClick={handleReceive}
                disabled={loading || uploadingPhoto || uploadingInvoice}
                className="w-full py-4 bg-[#222b3c] text-white font-bold rounded-xl hover:bg-black transition flex justify-center items-center gap-2 shadow-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? <Loader2 className="animate-spin"/> : <Save size={22}/>}
                GUARDAR Y CONFIRMAR
            </button>
        </div>
      </div>
    </div>
  );
}