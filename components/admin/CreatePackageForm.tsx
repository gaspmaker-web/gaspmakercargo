"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
// 1. Agregamos Printer, Tag y DollarSign a los iconos
import { Camera, Search, Package, Upload, CheckCircle, X, ScanBarcode, Printer, Tag, DollarSign } from 'lucide-react';
import Image from 'next/image';
import BarcodeScannerModal from '@/components/BarcodeScannerModal';

interface UserData {
  id: string;
  name: string;
  suiteNo: string;
  email: string;
  countryCode?: string; // Necesario para la etiqueta
}

export default function CreatePackageForm() {
  const [loading, setLoading] = useState(false);
  const [searchingUser, setSearchingUser] = useState(false);
  const [foundUser, setFoundUser] = useState<UserData | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // 2. Estado para guardar el paquete recién creado y mostrar opciones de impresión
  const [createdPackage, setCreatedPackage] = useState<any | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // --- FUNCIÓN IMPRIMIR ---
  const openPrintWindow = (format: '4x6' | '30334') => {
    if (!createdPackage) return;
    
    const params = new URLSearchParams({
        tracking: createdPackage.tracking,
        clientName: createdPackage.clientName,
        suite: createdPackage.suite,
        weight: createdPackage.weight.toString(),
        countryCode: createdPackage.countryCode,
        description: createdPackage.description,
        date: createdPackage.date,
        format: format
    });

    // Dimensiones de la ventana según el formato
    const w = format === '30334' ? 350 : 450;
    const h = format === '30334' ? 300 : 650;

    window.open(`/print/label?${params.toString()}`, 'Imprimir Etiqueta', `width=${w},height=${h},scrollbars=no`);
  };

  const handleSearchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = document.getElementById('userSearch') as HTMLInputElement;
    const query = input?.value;

    if (!query || query.length < 3) {
        alert("Ingresa al menos 3 caracteres");
        return;
    }

    setSearchingUser(true);
    setFoundUser(null);
    // Limpiamos el paquete creado anterior si buscamos un nuevo usuario
    setCreatedPackage(null);

    try {
      const res = await fetch(`/api/clientes?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      
      if (res.ok && data.users && data.users.length > 0) {
        setFoundUser(data.users[0]); 
      } else {
        alert(data.message || "Cliente no encontrado");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión al buscar cliente");
    } finally {
      setSearchingUser(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default');

      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.secure_url) {
        setPhotoUrl(data.secure_url);
      } else {
        throw new Error("No se recibió URL de Cloudinary");
      }
    } catch (error) {
      console.error("Error upload:", error);
      alert("Error al subir imagen");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: any) => {
    if (!foundUser) {
      alert("⚠️ Primero debes buscar y asignar un cliente.");
      return;
    }

    setLoading(true);
    setCreatedPackage(null); // Limpiar estado anterior

    try {
      const payload = {
        carrierTrackingNumber: data.trackingNumber, 
        description: data.description,
        weightLbs: parseFloat(data.weight),
        lengthIn: parseFloat(data.length || 0),
        widthIn: parseFloat(data.width || 0),
        heightIn: parseFloat(data.height || 0),
        userId: foundUser.id,
        photoUrlMiami: photoUrl,
        countryCode: 'US',
        
        // 🔥 ENVIAMOS EL VALOR DECLARADO
        declaredValue: parseFloat(data.declaredValue) || 0
      };

      const res = await fetch('/api/packages/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || result.message || "Error al crear paquete");
      }

      // 3. GUARDAMOS LOS DATOS PARA IMPRESIÓN
      setCreatedPackage({
        tracking: result.gmcTrackingNumber,
        clientName: foundUser.name,
        suite: foundUser.suiteNo,
        weight: payload.weightLbs,
        countryCode: foundUser.countryCode || 'GMC',
        description: payload.description,
        date: new Date().toLocaleDateString()
      });

      // Limpieza del formulario, pero MANTENEMOS foundUser y createdPackage visibles
      reset();
      setPhotoUrl(null);

    } catch (error: any) {
      console.error(error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto">
      
      {/* --- SECCIÓN DE ÉXITO E IMPRESIÓN --- */}
      {createdPackage && (
        <div className="mb-8 bg-green-50 border border-green-200 p-6 rounded-xl animate-fadeIn shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 p-2 rounded-full text-green-600">
                    <CheckCircle size={32} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-green-800">¡Paquete Registrado Exitosamente!</h3>
                    <p className="text-green-700 text-sm">Tracking GMC: <span className="font-mono font-bold">{createdPackage.tracking}</span></p>
                </div>
            </div>

            <div className="flex flex-wrap gap-3 ml-12">
                <button 
                    type="button"
                    onClick={() => openPrintWindow('4x6')}
                    className="flex items-center gap-2 bg-gmc-gris-oscuro text-white px-5 py-2.5 rounded-lg hover:bg-black transition shadow-md font-bold"
                >
                    <Printer size={20} /> Etiqueta 4x6"
                </button>
                <button 
                    type="button"
                    onClick={() => openPrintWindow('30334')}
                    className="flex items-center gap-2 bg-white text-gmc-gris-oscuro border border-gray-300 px-5 py-2.5 rounded-lg hover:bg-gray-50 transition shadow-sm font-bold"
                >
                    <Tag size={20} /> Barcode Mini
                </button>
            </div>
        </div>
      )}

      {/* 1. BUSCAR CLIENTE */}
      <div className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-100">
        <h3 className="text-lg font-bold text-gmc-gris-oscuro mb-4 flex items-center gap-2">
            <Search size={20} /> Asignar Cliente
        </h3>
        
        <div className="flex gap-3">
            <input 
                id="userSearch"
                type="text" 
                placeholder="Buscar por Suite (DO-12345), Email o Nombre" 
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gmc-dorado-principal outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleSearchUser(e)}
            />
            <button 
                type="button"
                onClick={handleSearchUser}
                disabled={searchingUser}
                className="bg-gmc-gris-oscuro text-white px-6 py-3 rounded-lg font-bold hover:bg-black transition-colors"
            >
                {searchingUser ? '...' : 'Buscar'}
            </button>
        </div>

        {foundUser && (
            <div className="mt-4 flex items-center gap-3 bg-white p-4 rounded-lg border border-green-200 text-gmc-gris-oscuro animate-fadeIn shadow-sm">
                <div className="bg-green-100 p-2 rounded-full">
                    <CheckCircle size={24} className="text-green-600" />
                </div>
                <div>
                    <p className="font-bold text-lg">{foundUser.name}</p>
                    <p className="text-sm text-gray-600">Suite: <span className="font-mono font-bold">{foundUser.suiteNo}</span> • {foundUser.email}</p>
                </div>
                <button onClick={() => { setFoundUser(null); setCreatedPackage(null); }} className="ml-auto text-gray-400 hover:text-red-500">
                    <X size={20} />
                </button>
            </div>
        )}
      </div>

      {/* 2. DATOS DEL PAQUETE */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* TRACKING + ESCÁNER */}
            <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Tracking Number (Carrier Original)</label>
                <div className="flex gap-2">
                    <input 
                        {...register("trackingNumber", { required: true })}
                        placeholder="Ej: 1Z999..." 
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gmc-dorado-principal outline-none uppercase font-mono"
                    />
                    <button 
                        type="button"
                        onClick={() => setIsScannerOpen(true)}
                        className="bg-gray-200 text-gray-700 px-4 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2 font-bold"
                    >
                        <ScanBarcode size={20} /> Scan
                    </button>
                </div>
                {errors.trackingNumber && <span className="text-red-500 text-xs">Requerido</span>}
            </div>

            {/* Descripción */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Descripción del Contenido</label>
                <input 
                    {...register("description", { required: true })}
                    placeholder="Ej: Ropa, Zapatos..." 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gmc-dorado-principal outline-none"
                />
            </div>

            {/* 🔥 NUEVO: Valor Declarado */}
            <div>
                <label className="block text-sm font-bold text-blue-600 mb-1 flex items-center gap-1">
                    <DollarSign size={14} /> Valor Declarado ($)
                </label>
                <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    {...register("declaredValue")}
                    className="w-full p-3 border border-blue-200 bg-blue-50/30 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-800"
                />
                <p className="text-[10px] text-gray-400 mt-1">+ Seguro (3%) si {'>'} $100</p>
            </div>

            {/* Peso */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Peso (Lbs)</label>
                <input 
                    type="number" 
                    step="0.01"
                    {...register("weight", { required: true })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gmc-dorado-principal outline-none"
                />
            </div>

            {/* Dimensiones */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Dimensiones (L x W x H)</label>
                <div className="flex gap-2">
                    <input type="number" placeholder="L" {...register("length")} className="w-full p-3 border rounded-lg"/>
                    <input type="number" placeholder="W" {...register("width")} className="w-full p-3 border rounded-lg"/>
                    <input type="number" placeholder="H" {...register("height")} className="w-full p-3 border rounded-lg"/>
                </div>
            </div>
        </div>

        {/* 3. FOTO ALMACÉN */}
        <div className="border-t border-gray-100 pt-6">
            <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Camera size={18} /> Foto de Recepción (Almacén Miami)
            </label>
            
            <div className="flex items-start gap-6">
                <div className="w-32 h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative">
                    {photoUrl ? (
                        <>
                            <Image src={photoUrl} alt="Preview" layout="fill" objectFit="cover" />
                            <button 
                                type="button"
                                onClick={() => setPhotoUrl(null)}
                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 z-10"
                            >
                                <X size={12} />
                            </button>
                        </>
                    ) : (
                        <div className="text-gray-400 text-xs text-center px-2 flex flex-col items-center">
                            {isUploading ? <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full mb-1"></div> : <Package size={24} className="mb-1 opacity-50"/>}
                            {isUploading ? "Subiendo..." : "Sin foto"}
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    <label className={`cursor-pointer inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition shadow-sm ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <Upload className="mr-2 h-4 w-4" />
                        {isUploading ? 'Subiendo...' : 'Tomar / Subir Foto'}
                        <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment" 
                            className="hidden" 
                            onChange={handlePhotoUpload} 
                            disabled={isUploading}
                        />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                        Sube una foto del paquete físico para que el cliente la vea en su dashboard.
                    </p>
                </div>
            </div>
        </div>

        <div className="pt-4">
            <button 
                type="submit" 
                disabled={loading || !foundUser}
                className="w-full bg-gmc-dorado-principal text-gmc-gris-oscuro py-4 rounded-xl font-bold text-lg hover:brightness-105 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? 'Registrando...' : <><Package size={20} /> Registrar Entrada en Miami</>}
            </button>
        </div>

      </form>

      <BarcodeScannerModal 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(code) => {
            setValue('trackingNumber', code); 
            setIsScannerOpen(false);
        }}
      />
    </div>
  );
}