"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Camera, Search, CheckCircle, X, ScanBarcode, Printer, Tag, DollarSign, User, Save, Scale, Ruler, FileText, Plus, Trash2, Globe } from 'lucide-react';
import Image from 'next/image';
import BarcodeScannerModal from '@/components/BarcodeScannerModal';

interface UserData {
  id: string;
  name: string;
  suiteNo: string;
  email: string;
  countryCode?: string;
}

export default function CreatePackageForm() {
  const [loading, setLoading] = useState(false);
  const [searchingUser, setSearchingUser] = useState(false);
  const [foundUser, setFoundUser] = useState<UserData | null>(null);
  
  // Estados para Evidencia
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Estados para el Invoice
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [isUploadingInvoice, setIsUploadingInvoice] = useState(false);

  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Estado para impresión
  const [createdPackage, setCreatedPackage] = useState<any | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // ========================================================================
  // 🔥 NUEVO: ESTADO PARA LA TABLA DE ADUANAS (DHL/FEDEX)
  // ========================================================================
  const [customsItems, setCustomsItems] = useState([
      { qty: 1, description: '', value: '' }
  ]);

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
      
      // Auto-calcular el Valor Declarado Total si cambian montos o cantidades
      if (field === 'value' || field === 'qty') {
          recalculateTotalValue(newItems);
      }
  };

  const recalculateTotalValue = (items: any[]) => {
      const total = items.reduce((acc, item) => acc + (Number(item.qty) * Number(item.value || 0)), 0);
      setValue('declaredValue', total.toFixed(2));
  };
  // ========================================================================

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

    const w = format === '30334' ? 350 : 450;
    const h = format === '30334' ? 300 : 650;

    window.open(`/print/label?${params.toString()}`, 'Imprimir Etiqueta', `width=${w},height=${h},scrollbars=no`);
  };

  const handleSearchUser = async (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    const input = document.getElementById('userSearch') as HTMLInputElement;
    const query = input?.value;

    if (!query || query.length < 3) {
        alert("Ingresa al menos 3 caracteres");
        return;
    }

    setSearchingUser(true);
    setFoundUser(null);
    setCreatedPackage(null);

    try {
      const res = await fetch(`/api/clientes?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      
      if (res.ok && data.users && data.users.length > 0) {
        setFoundUser(data.users[0]); 
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
      } else {
        alert(data.message || "Cliente no encontrado");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión");
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
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([50, 50]);
      } else {
        throw new Error("No se recibió URL");
      }
    } catch (error) {
      console.error("Error upload:", error);
      alert("Error al subir imagen");
    } finally {
      setIsUploading(false);
    }
  };

  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingInvoice(true);
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
        setInvoiceUrl(data.secure_url);
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([50, 50]);
      } else {
        throw new Error("No se recibió URL");
      }
    } catch (error) {
      console.error("Error upload invoice:", error);
      alert("Error al subir el invoice");
    } finally {
      setIsUploadingInvoice(false);
    }
  };

  const onSubmit = async (data: any) => {
    if (!foundUser) {
      alert("⚠️ Asigna un cliente primero.");
      return;
    }

    // Validación de la tabla de aduanas
    const isValidCustoms = customsItems.every(item => item.description.trim() !== '' && Number(item.value) >= 0);
    if (!isValidCustoms) {
        alert("⚠️ Por favor completa correctamente la descripción y valor de todos los artículos de aduana.");
        return;
    }

    setLoading(true);
    setCreatedPackage(null);

    // Creamos una descripción de texto combinada (Para mantener compatibilidad con el resto del sistema)
    const combinedDescription = customsItems.map(item => `${item.qty}x ${item.description}`).join(', ');

    try {
      const payload = {
        carrierTrackingNumber: data.trackingNumber.toUpperCase(), 
        description: combinedDescription, // Texto plano (Compatibilidad)
        customsItems: customsItems,       // 🔥 JSON DETALLADO PARA BASE DE DATOS
        weightLbs: parseFloat(data.weight),
        lengthIn: parseFloat(data.length || 0),
        widthIn: parseFloat(data.width || 0),
        heightIn: parseFloat(data.height || 0),
        userId: foundUser.id,
        photoUrlMiami: photoUrl,
        invoiceUrl: invoiceUrl, 
        countryCode: 'US',
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

      setCreatedPackage({
        tracking: result.gmcTrackingNumber,
        clientName: foundUser.name,
        suite: foundUser.suiteNo,
        weight: payload.weightLbs,
        countryCode: foundUser.countryCode || 'GMC',
        description: payload.description,
        date: new Date().toLocaleDateString()
      });
      
      // Reseteamos todo al terminar
      reset();
      setPhotoUrl(null);
      setInvoiceUrl(null); 
      setCustomsItems([{ qty: 1, description: '', value: '' }]); // Limpiamos tabla aduanas
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error: any) {
      console.error(error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <BarcodeScannerModal 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(code) => {
            setValue('trackingNumber', code); 
            setIsScannerOpen(false);
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(100);
        }}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto overflow-hidden">
        
        {/* --- SECCIÓN ÉXITO / IMPRESIÓN --- */}
        {createdPackage && (
          <div className="bg-green-50 p-6 border-b border-green-100 animate-fadeIn">
              <div className="flex flex-col items-center text-center mb-4">
                  <div className="bg-green-100 p-3 rounded-full text-green-600 mb-2">
                      <CheckCircle size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-green-800">¡Paquete Registrado!</h3>
                  <p className="text-green-700 font-mono text-lg font-bold">{createdPackage.tracking}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                  <button 
                      type="button"
                      onClick={() => openPrintWindow('4x6')}
                      className="flex flex-col items-center justify-center gap-1 bg-gmc-gris-oscuro text-white py-4 rounded-xl shadow-md active:scale-95 transition-all"
                  >
                      <Printer size={24} /> 
                      <span className="font-bold text-sm">Etiqueta 4x6"</span>
                  </button>
                  <button 
                      type="button"
                      onClick={() => openPrintWindow('30334')}
                      className="flex flex-col items-center justify-center gap-1 bg-white text-gmc-gris-oscuro border-2 border-gmc-gris-oscuro py-4 rounded-xl shadow-sm active:scale-95 transition-all"
                  >
                      <Tag size={24} /> 
                      <span className="font-bold text-sm">Barcode Mini</span>
                  </button>
              </div>
          </div>
        )}

        {/* --- 1. BUSCAR CLIENTE --- */}
        <div className={`p-4 md:p-6 transition-colors ${foundUser ? 'bg-white' : 'bg-blue-50'}`}>
          {!foundUser ? (
             <div className="space-y-3">
                <label className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-2">
                    <Search size={14} /> 1. Asignar Cliente
                </label>
                <div className="flex gap-2 h-14">
                    <input 
                        id="userSearch"
                        type="text" 
                        placeholder="Suite (GMC-123) o Nombre" 
                        className="flex-1 px-4 rounded-xl border-2 border-blue-200 focus:border-blue-500 outline-none text-lg font-medium shadow-sm"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchUser(e)}
                    />
                    <button 
                        type="button"
                        onClick={(e) => handleSearchUser(e)}
                        disabled={searchingUser}
                        className="bg-blue-600 text-white px-6 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md"
                    >
                        {searchingUser ? '...' : <Search size={24}/>}
                    </button>
                </div>
             </div>
          ) : (
             <div className="relative bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                <div className="bg-blue-100 p-3 rounded-full text-blue-700">
                    <User size={24} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-lg truncate">{foundUser.name}</p>
                    <p className="text-sm text-blue-700 font-mono font-bold">{foundUser.suiteNo}</p>
                </div>
                <button 
                    onClick={() => { setFoundUser(null); setCreatedPackage(null); }} 
                    className="p-2 bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm border border-gray-100"
                >
                    <X size={20} />
                </button>
             </div>
          )}
        </div>

        <div className="h-px bg-gray-100 w-full"></div>

        {/* --- 2. FORMULARIO PRINCIPAL --- */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-6 space-y-6">
            
            {/* TRACKING + SCANNER */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    2. Tracking Number
                </label>
                <div className="flex gap-3 h-14">
                    <div className="relative flex-1">
                        <input 
                            {...register("trackingNumber", { required: true })}
                            placeholder="1Z99..." 
                            className="w-full h-full pl-4 pr-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-gmc-dorado-principal focus:ring-0 text-lg font-mono uppercase font-bold"
                        />
                    </div>
                    <button 
                        type="button"
                        onClick={() => setIsScannerOpen(true)}
                        className="bg-slate-800 text-white px-5 rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2 font-bold shadow-lg active:scale-95"
                    >
                        <ScanBarcode size={24} className="text-gmc-dorado-principal" />
                        <span className="hidden sm:inline">ESCANEAR</span>
                    </button>
                </div>
                {errors.trackingNumber && <span className="text-red-500 text-xs font-bold">⚠️ Tracking requerido</span>}
            </div>

            {/* PESO Y VALOR TOTAL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                        3. Peso (Lbs)
                    </label>
                    <div className="relative">
                        <Scale className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="number" 
                            step="0.01"
                            {...register("weight", { required: true })}
                            placeholder="0.00"
                            className="w-full h-12 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 text-xl font-bold font-mono text-gray-800"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1 block">
                        Valor Declarado Total ($)
                    </label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
                        <input 
                            type="number" 
                            step="0.01"
                            {...register("declaredValue")}
                            placeholder="0.00"
                            className="w-full h-12 pl-10 pr-4 bg-blue-50 border border-blue-200 rounded-xl focus:border-blue-500 text-lg font-bold text-blue-900"
                        />
                    </div>
                </div>
            </div>

            {/* 🔥 DIMENSIONES 🔥 */}
            <details className="group bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <summary className="cursor-pointer p-3 font-bold text-xs text-gray-500 uppercase hover:bg-gray-100 flex items-center gap-2 select-none">
                    <Ruler size={14} /> Opciones Avanzadas (Dimensiones)
                </summary>
                <div className="p-3 grid grid-cols-3 gap-3 animate-fadeIn">
                    <input type="number" placeholder="Largo" {...register("length")} className="w-full p-2 border border-gray-300 rounded-lg text-center"/>
                    <input type="number" placeholder="Ancho" {...register("width")} className="w-full p-2 border border-gray-300 rounded-lg text-center"/>
                    <input type="number" placeholder="Alto" {...register("height")} className="w-full p-2 border border-gray-300 rounded-lg text-center"/>
                </div>
            </details>

            {/* 🔥 NUEVO: TABLA DE DECLARACIÓN DE ADUANAS 🔥 */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <Globe size={16} className="text-blue-500" /> Declaración Comercial (Aduanas)
                    </label>
                </div>
                
                {/* Cabeceras de la tabla */}
                <div className="flex gap-2 text-[10px] font-bold text-slate-500 uppercase mb-2 px-1">
                    <div className="w-16 text-center">Cant.</div>
                    <div className="flex-1">Descripción Detallada (Inglés)</div>
                    <div className="w-24 text-center">V. Unitario</div>
                    <div className="w-8"></div>
                </div>

                <div className="space-y-2">
                    {customsItems.map((item, index) => (
                        <div key={index} className="flex gap-2 items-start animate-fadeIn">
                            <input 
                                type="number" min="1" 
                                value={item.qty} 
                                onChange={e => updateCustomsItem(index, 'qty', e.target.value)} 
                                className="w-16 h-10 border border-slate-300 rounded-lg text-center font-bold text-sm focus:border-blue-500" 
                                placeholder="1" 
                            />
                            <input 
                                type="text" 
                                value={item.description} 
                                onChange={e => updateCustomsItem(index, 'description', e.target.value)} 
                                className="flex-1 h-10 px-3 border border-slate-300 rounded-lg text-sm focus:border-blue-500" 
                                placeholder="Ej: Men's Cotton T-Shirts" 
                            />
                            <div className="relative w-24">
                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input 
                                    type="number" step="0.01" 
                                    value={item.value} 
                                    onChange={e => updateCustomsItem(index, 'value', e.target.value)} 
                                    className="w-full h-10 pl-6 pr-2 border border-slate-300 rounded-lg font-mono text-sm focus:border-blue-500" 
                                    placeholder="0.00" 
                                />
                            </div>
                            <button 
                                type="button" 
                                onClick={() => removeCustomsItem(index)} 
                                className="h-10 w-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>

                <button 
                    type="button" 
                    onClick={addCustomsItem} 
                    className="mt-3 text-sm font-bold text-blue-600 flex items-center gap-1 hover:text-blue-800 transition-colors"
                >
                    <Plus size={16} /> Agregar Artículo
                </button>
            </div>

            {/* 🔥 GRID PARA FOTOS (EVIDENCIA E INVOICE) 🔥 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. FOTO EVIDENCIA */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                        4. Foto del Paquete
                    </label>
                    
                    <div className="relative">
                        <label className={`
                            relative w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] overflow-hidden
                            ${photoUrl ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}
                        `}>
                            {photoUrl ? (
                                <>
                                    <Image src={photoUrl} alt="Preview" fill className="object-cover opacity-60" />
                                    <div className="z-10 bg-white/90 px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
                                        <CheckCircle size={18} className="text-green-600" />
                                        <span className="text-xs font-bold text-green-800">FOTO LISTA</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {isUploading ? (
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    ) : (
                                        <Camera size={32} className="text-gray-400" />
                                    )}
                                    <span className="text-xs font-bold text-gray-500 text-center px-2">
                                        {isUploading ? 'SUBIENDO...' : 'TOMAR FOTO'}
                                    </span>
                                </>
                            )}
                            
                            <input 
                                type="file" 
                                accept="image/*" 
                                capture="environment" 
                                className="hidden" 
                                onChange={handlePhotoUpload} 
                                disabled={isUploading}
                            />
                        </label>

                        {photoUrl && (
                            <button 
                                type="button"
                                onClick={(e) => { e.preventDefault(); setPhotoUrl(null); }}
                                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-md z-20"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* 2. FOTO INVOICE (OPCIONAL) */}
                <div>
                    <label className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 block flex items-center gap-1">
                        <FileText size={14}/> 5. Factura / Invoice <span className="text-gray-400 normal-case font-medium">(Opcional)</span>
                    </label>
                    
                    <div className="relative">
                        <label className={`
                            relative w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] overflow-hidden
                            ${invoiceUrl ? 'border-blue-500 bg-blue-50' : 'border-blue-200 bg-blue-50/50 hover:bg-blue-50'}
                        `}>
                            {invoiceUrl ? (
                                <>
                                    {invoiceUrl.endsWith('.pdf') ? (
                                        <div className="flex items-center justify-center bg-blue-100 w-full h-full">
                                            <FileText size={40} className="text-blue-500" />
                                        </div>
                                    ) : (
                                        <Image src={invoiceUrl} alt="Invoice Preview" fill className="object-cover opacity-60" />
                                    )}
                                    <div className="z-10 bg-white/90 px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
                                        <CheckCircle size={18} className="text-blue-600" />
                                        <span className="text-xs font-bold text-blue-800">INVOICE LISTO</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {isUploadingInvoice ? (
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    ) : (
                                        <FileText size={32} className="text-blue-400" />
                                    )}
                                    <span className="text-xs font-bold text-blue-600 text-center px-2">
                                        {isUploadingInvoice ? 'SUBIENDO...' : 'SUBIR INVOICE / FOTO'}
                                    </span>
                                </>
                            )}
                            
                            <input 
                                type="file" 
                                accept="image/*,application/pdf" 
                                className="hidden" 
                                onChange={handleInvoiceUpload} 
                                disabled={isUploadingInvoice}
                            />
                        </label>

                        {invoiceUrl && (
                            <button 
                                type="button"
                                onClick={(e) => { e.preventDefault(); setInvoiceUrl(null); }}
                                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-md z-20"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* BOTÓN SUBMIT */}
            <div className="pt-4 pb-2">
                <button 
                    type="submit" 
                    disabled={loading || !foundUser}
                    className="w-full h-16 bg-gmc-dorado-principal text-gmc-gris-oscuro rounded-xl font-bold text-lg hover:brightness-105 shadow-xl transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2 active:scale-95"
                >
                    {loading ? (
                        'Registrando...' 
                    ) : (
                        <>
                            <Save size={24} /> REGISTRAR ENTRADA
                        </>
                    )}
                </button>
            </div>

        </form>
      </div>
    </>
  );
}