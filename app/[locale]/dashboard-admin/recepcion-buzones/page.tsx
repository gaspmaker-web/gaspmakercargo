"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, Camera, AlertTriangle, UploadCloud, CheckCircle2, User, Mailbox, Loader2, Weight, Ruler } from 'lucide-react'; // 🔥 Agregamos Ruler

export default function EstacionRecepcionBodega() {
  const [suiteQuery, setSuiteQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<any>(null);
  
  // Datos del Sobre
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDamaged, setIsDamaged] = useState(false);
  
  // Calculadora de Peso
  const [weightLb, setWeightLb] = useState<string>('');
  const [weightOz, setWeightOz] = useState<string>('');
  const [totalOz, setTotalOz] = useState<number>(0);

  // 🔥 Dimensiones para EasyPost
  const [lengthIn, setLengthIn] = useState<string>('');
  const [widthIn, setWidthIn] = useState<string>('');
  const [heightIn, setHeightIn] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const lb = parseFloat(weightLb) || 0;
    const oz = parseFloat(weightOz) || 0;
    setTotalOz((lb * 16) + oz);
  }, [weightLb, weightOz]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // 🔥 Botones Rápidos de Medidas
  const setQuickDimensions = (l: string, w: string, h: string) => {
      setLengthIn(l);
      setWidthIn(w);
      setHeightIn(h);
  };

  // 1. BUSCAR EN LA BASE DE DATOS
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suiteQuery) return;
    setIsSearching(true);
    setFoundUser(null);
    
    try {
        const res = await fetch(`/api/admin/bodega/buscar-buzon?suite=${suiteQuery}`);
        const data = await res.json();

        if (res.ok) {
            setFoundUser(data);
        } else {
            alert(data.error || "Buzón no encontrado");
        }
    } catch (error) {
        alert("Error de conexión");
    } finally {
        setIsSearching(false);
    }
  };

  // 2. ENVIAR A LA BASE DE DATOS
  const handleSubmit = async () => {
    if (!foundUser || !imageFile) return;
    
    setIsSubmitting(true);
    try {
        // 🔥 1. GENERAR TRACKING INTERNO (M- seguido de 6 dígitos numéricos aleatorios)
        const randomDigits = Math.floor(100000 + Math.random() * 900000);
        const autoTracking = `M-${randomDigits}`;

        const formData = new FormData();
        formData.append("userId", foundUser.id);
        formData.append("image", imageFile);
        formData.append("isDamaged", isDamaged.toString());
        formData.append("totalOz", totalOz.toString());
        
        // 🔥 2. ADJUNTAR TRACKING 
        formData.append("trackingNumber", autoTracking);
        
        // Adjuntamos las medidas al envío si existen
        if (lengthIn) formData.append("lengthIn", lengthIn);
        if (widthIn) formData.append("widthIn", widthIn);
        if (heightIn) formData.append("heightIn", heightIn);

        const res = await fetch('/api/admin/bodega/recibir-sobre', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();

        if (res.ok) {
            // 🔥 3. ALERTA PARA ESCRIBIR EL TRACKING CORTO EN EL SOBRE
            alert(`✅ ¡Sobre registrado en el buzón!\n\n✍️ ESCRIBE ESTA REFERENCIA EN EL SOBRE:\n\n${autoTracking}`);
            handleReset(); 
        } else {
            alert(data.error || "Ocurrió un error");
        }
    } catch (error) {
        alert("Error de red");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuiteQuery('');
    setFoundUser(null);
    setImageFile(null);
    setImagePreview(null);
    setIsDamaged(false);
    setWeightLb('');
    setWeightOz('');
    setLengthIn('');
    setWidthIn('');
    setHeightIn('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-600 p-3 rounded-xl shadow-md">
                <Mailbox className="text-white" size={28} />
            </div>
            <div>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Estación de Recepción</h1>
                <p className="text-gray-500 font-medium">Escanea o ingresa el número de PMB (Suite) para procesar correspondencia.</p>
            </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
            <form onSubmit={handleSearch} className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                    <input 
                        ref={inputRef}
                        type="text" 
                        value={suiteQuery}
                        onChange={(e) => setSuiteQuery(e.target.value)}
                        placeholder="Ej: 76826..." 
                        className="w-full pl-12 pr-4 py-4 sm:py-5 bg-gray-50 border-2 border-gray-200 rounded-2xl text-xl font-black text-gray-900 outline-none focus:border-blue-500 focus:bg-white transition-all uppercase placeholder:normal-case"
                        autoComplete="off"
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={isSearching || !suiteQuery}
                    className="bg-gray-900 hover:bg-black text-white px-8 rounded-2xl font-bold text-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    {isSearching ? <Loader2 className="animate-spin" /> : "Buscar"}
                </button>
            </form>
        </div>

        {foundUser && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-md border-2 border-blue-100 animate-in slide-in-from-bottom-4 fade-in duration-300">
                
                <div className="flex items-center justify-between bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="bg-white p-3 rounded-full shadow-sm">
                            <User className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">Destinatario</p>
                            <h2 className="text-xl font-black text-gray-900">{foundUser.name}</h2>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">Suite</p>
                        <p className="text-2xl font-black text-blue-700">#{foundUser.suiteNo}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* COLUMNA IZQUIERDA: FOTO */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2"><Camera size={18}/> Foto Frontal del Sobre</h3>
                        
                        <label className="block w-full aspect-[4/3] bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl overflow-hidden cursor-pointer hover:bg-gray-100 hover:border-blue-400 transition-all relative group">
                            <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" />
                            
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-blue-500">
                                    <Camera size={48} className="mb-3 opacity-50" />
                                    <p className="font-bold">Tocar para tomar foto</p>
                                    <p className="text-xs mt-1">O subir desde galería</p>
                                </div>
                            )}
                        </label>
                    </div>

                    {/* COLUMNA DERECHA: DATOS LOGÍSTICOS */}
                    <div className="space-y-6">
                        
                        {/* PESO */}
                        <div>
                            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Weight size={18}/> Peso (Para envíos)</h3>
                            <div className="flex gap-4 items-center">
                                <div className="relative flex-1">
                                    <input type="number" min="0" value={weightLb} onChange={(e) => setWeightLb(e.target.value)} placeholder="0" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-lg font-bold text-right outline-none focus:border-blue-500" />
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Libras (lb)</span>
                                </div>
                                <div className="relative flex-1">
                                    <input type="number" min="0" max="15.99" step="0.1" value={weightOz} onChange={(e) => setWeightOz(e.target.value)} placeholder="0.0" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-lg font-bold text-right outline-none focus:border-blue-500" />
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Onzas (oz)</span>
                                </div>
                            </div>
                            <p className="text-right text-xs text-gray-400 mt-2 font-medium">Total Sistema: <strong className="text-blue-600">{totalOz.toFixed(2)} oz</strong></p>
                        </div>

                        {/* DIMENSIONES PARA EASYPOST */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Ruler size={18}/> Dimensiones en Pulgadas (Tarifas)</h3>
                            
                            {/* Botones Rápidos */}
                            <div className="flex gap-2 mb-3">
                                <button type="button" onClick={() => setQuickDimensions('6', '4', '0.1')} className="flex-1 py-2 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[10px] sm:text-xs font-bold rounded-lg border border-slate-200 hover:border-blue-300 transition-colors uppercase tracking-wider shadow-sm">✉️ Postcard</button>
                                <button type="button" onClick={() => setQuickDimensions('9', '4', '0.2')} className="flex-1 py-2 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[10px] sm:text-xs font-bold rounded-lg border border-slate-200 hover:border-blue-300 transition-colors uppercase tracking-wider shadow-sm">💌 Carta</button>
                                <button type="button" onClick={() => setQuickDimensions('12', '9', '0.5')} className="flex-1 py-2 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[10px] sm:text-xs font-bold rounded-lg border border-slate-200 hover:border-blue-300 transition-colors uppercase tracking-wider shadow-sm">📁 Manila</button>
                            </div>

                            {/* Inputs Manuales */}
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input type="number" step="0.1" value={lengthIn} onChange={e => setLengthIn(e.target.value)} placeholder="Largo" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-center outline-none focus:border-blue-500" />
                                </div>
                                <div className="relative flex-1">
                                    <input type="number" step="0.1" value={widthIn} onChange={e => setWidthIn(e.target.value)} placeholder="Ancho" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-center outline-none focus:border-blue-500" />
                                </div>
                                <div className="relative flex-1">
                                    <input type="number" step="0.1" value={heightIn} onChange={e => setHeightIn(e.target.value)} placeholder="Grosor" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-center outline-none focus:border-blue-500" />
                                </div>
                            </div>
                        </div>

                        {/* ESTADO DEL SOBRE */}
                        <div 
                            onClick={() => setIsDamaged(!isDamaged)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${isDamaged ? 'bg-red-50 border-red-400 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                        >
                            <div className={`p-2 rounded-full ${isDamaged ? 'bg-red-200' : 'bg-gray-200'}`}>
                                <AlertTriangle size={24} />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-lg">Sobre llegó dañado</p>
                                <p className="text-xs opacity-80">Roto, abierto o mojado por USPS.</p>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isDamaged ? 'border-red-600 bg-red-600 text-white' : 'border-gray-400'}`}>
                                {isDamaged && <CheckCircle2 size={16} />}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex gap-4">
                    <button onClick={handleReset} className="px-6 py-4 rounded-2xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={!imageFile || isSubmitting}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-black text-lg py-4 rounded-2xl transition-colors shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" /> : <UploadCloud />}
                        {isSubmitting ? 'Procesando...' : 'Recibir y Notificar al Cliente'}
                    </button>
                </div>

            </div>
        )}

      </div>
    </div>
  );
}