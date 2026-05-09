"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// ❌ ArrowLeft eliminado
import { Package, Upload, FileText, CheckCircle, Info, Truck, DollarSign, Loader2, ShoppingBag, Globe, Box } from 'lucide-react';
// 🔥 Importamos el hook de traducción
import { useTranslations } from 'next-intl';

// --- CONFIGURACIÓN DE COURIERS CON COLORES DE MARCA ---
const CARRIERS = [
    { 
        id: 'AMAZON', 
        name: 'Amazon', 
        icon: ShoppingBag, 
        activeClass: 'border-[#FF9900] text-[#FF9900] bg-[#FF9900]/10 ring-[#FF9900]/30' 
    },
    { 
        id: 'USPS', 
        name: 'USPS', 
        icon: Truck, 
        activeClass: 'border-[#333366] text-[#333366] bg-[#333366]/10 ring-[#333366]/30' 
    },
    { 
        id: 'UPS', 
        name: 'UPS', 
        icon: Box, 
        activeClass: 'border-[#351C15] text-[#351C15] bg-[#FFB500]/20 ring-[#351C15]/30' 
    },
    { 
        id: 'FEDEX', 
        name: 'FedEx', 
        icon: Truck, 
        activeClass: 'border-[#4D148C] text-[#4D148C] bg-[#4D148C]/10 ring-[#4D148C]/30' 
    },
    { 
        id: 'DHL', 
        name: 'DHL', 
        icon: Globe, 
        activeClass: 'border-[#D40511] text-[#D40511] bg-[#FFCC00]/30 ring-[#D40511]/30' 
    },
    { 
        id: 'SHEIN', 
        name: 'Shein', 
        icon: ShoppingBag, 
        activeClass: 'border-black text-black bg-gray-100 ring-gray-300' 
    },
    { 
        id: 'OTHER', 
        name: 'Otro', // Se traducirá en el render
        icon: Package, 
        activeClass: 'border-gray-500 text-gray-600 bg-gray-100 ring-gray-300' 
    }
];

export default function PreAlertPage() {
  // 🔥 Inicializamos los namespaces necesarios
  const t = useTranslations('PreAlertPage');
  const tDash = useTranslations('Dashboard');
  const tRef = useTranslations('Referral'); // Para el botón "Volver"
  
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
      trackingNumber: '',
      carrier: 'AMAZON', 
      description: '',
      value: '',
      invoiceUrl: ''
  });

  // --- 1. SUBIDA DE FACTURA ---
  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      try {
          const data = new FormData();
          data.append('file', file);
          data.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default');
          
          const resourceType = file.type === 'application/pdf' ? 'raw' : 'image';
          const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`, {
              method: 'POST',
              body: data
          });
          const json = await res.json();
          
          if (json.secure_url) {
              setFormData(prev => ({ ...prev, invoiceUrl: json.secure_url }));
          }
      } catch (error) {
          console.error("Error subiendo factura", error);
          alert(tDash('errorGeneric'));
      } finally {
          setIsUploading(false);
      }
  };

  // --- 2. ENVIAR FORMULARIO ---
  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!formData.trackingNumber || !formData.description || !formData.value) {
          alert(t('alertMissingFields'));
          return;
      }

      setIsLoading(true);
      try {
          const res = await fetch('/api/pre-alert', { 
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  ...formData,
                  value: parseFloat(formData.value)
              })
          });

          if (res.ok) {
              setStep(2); // Éxito
          } else {
              const data = await res.json();
              alert(data.message || tDash('errorGeneric'));
          }
      } catch (error) {
          alert(tDash('errorConnection'));
      } finally {
          setIsLoading(false);
      }
  };

  // --- VISTA DE ÉXITO ---
  if (step === 2) {
      return (
          <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center font-montserrat">
              <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center border border-gray-100 animate-fadeIn">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle size={40} className="text-green-600"/>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">{t('successMessage')}</h2>
                  <p className="text-gray-600 mb-6">
                      {t('infoPoint1')}
                  </p>
                  <div className="flex flex-col gap-3">
                      <button onClick={() => { setStep(1); setFormData({ trackingNumber: '', carrier: 'AMAZON', description: '', value: '', invoiceUrl: '' }); }} className="w-full px-6 py-3 bg-gmc-dorado-principal text-gmc-gris-oscuro rounded-xl font-bold hover:bg-white border border-transparent hover:border-gmc-dorado-principal transition-all">
                          {t('btnSubmit')}
                      </button>
                      <Link href="/dashboard-cliente" className="w-full px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all">
                          {tRef('backDashboard')}
                      </Link>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 font-montserrat">
      <div className="max-w-4xl mx-auto">
        
        {/* Header CENTRADO */}
        <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gmc-gris-oscuro font-garamond">{t('title')}</h1>
            <p className="text-sm text-gray-500">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* COLUMNA IZQUIERDA: FORMULARIO */}
            <div className="lg:col-span-2">
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
                    
                    {/* 1. TRACKING & CARRIER */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-3">{t('labelCarrier')}</label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
                            {CARRIERS.map(c => (
                                <button 
                                    key={c.id} 
                                    type="button"
                                    onClick={() => setFormData({...formData, carrier: c.id})}
                                    className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-200 ${
                                        formData.carrier === c.id 
                                            ? `${c.activeClass} ring-2 shadow-sm scale-105` 
                                            : 'border-gray-100 hover:border-gray-300 text-gray-400 hover:text-gray-600 bg-white'
                                    }`}
                                >
                                    <c.icon size={24} strokeWidth={formData.carrier === c.id ? 2.5 : 2} />
                                    <span className="text-[10px] font-bold mt-2 text-center truncate w-full">
                                        {/* Traducimos "Otro" dinámicamente */}
                                        {c.id === 'OTHER' ? t('carrierOther') : c.name}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t('labelTracking')}</label>
                        <input 
                            type="text" 
                            placeholder={t('trackingPlaceholder')}
                            className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-gmc-dorado-principal font-mono uppercase text-gmc-gris-oscuro font-bold"
                            value={formData.trackingNumber}
                            onChange={e => setFormData({...formData, trackingNumber: e.target.value.toUpperCase()})}
                            required
                        />
                    </div>

                    {/* 2. DETALLES DEL PRODUCTO */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t('labelDescription')}</label>
                            <input 
                                type="text" 
                                placeholder={t('placeholderDesc')} 
                                className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t('labelValue')}</label>
                            <div className="relative">
                                <DollarSign size={16} className="absolute left-3 top-3.5 text-gray-400"/>
                                <input 
                                    type="number" 
                                    placeholder="0.00" 
                                    className="w-full p-3 pl-9 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                                    value={formData.value}
                                    onChange={e => setFormData({...formData, value: e.target.value})}
                                    required
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 3. SUBIR FACTURA */}
                    <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-colors ${formData.invoiceUrl ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'}`}>
                        {formData.invoiceUrl ? (
                            <div className="text-center">
                                <FileText size={40} className="mx-auto text-green-600 mb-2"/>
                                <p className="text-sm font-bold text-green-700">{t('fileSelected')}</p>
                                <button 
                                    type="button" 
                                    onClick={() => document.getElementById('invoiceInput')?.click()} 
                                    className="text-xs text-green-600 underline mt-2 hover:text-green-800"
                                >
                                    {t('changeFileBtn')}
                                </button>
                            </div>
                        ) : (
                            <div className="text-center">
                                <Upload size={32} className="mx-auto text-gray-400 mb-2"/>
                                <p className="text-sm text-gray-600 font-bold">{t('labelUpload')}</p>
                                <p className="text-xs text-gray-400 mb-4">{t('fileFormats')}</p>
                                <button 
                                    type="button" 
                                    onClick={() => document.getElementById('invoiceInput')?.click()} 
                                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all shadow-sm"
                                    disabled={isUploading}
                                >
                                    {isUploading ? t('submitting') : t('btnSelectFile')}
                                </button>
                            </div>
                        )}
                        <input 
                            id="invoiceInput" 
                            type="file" 
                            accept="image/*,application/pdf" 
                            className="hidden" 
                            onChange={handleInvoiceUpload} 
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading || isUploading} 
                        className="w-full py-4 bg-gmc-dorado-principal text-gmc-gris-oscuro font-bold rounded-xl hover:bg-white border border-transparent hover:border-gmc-dorado-principal transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 className="animate-spin"/> : <Package size={20}/>}
                        {isLoading ? t('submitting') : t('btnSubmit')}
                    </button>

                </form>
            </div>

            {/* COLUMNA DERECHA: TIPS */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                    <h3 className="font-bold text-blue-800 flex items-center gap-2 mb-3">
                        <Info size={18}/> {t('infoTitle')}
                    </h3>
                    <ul className="text-sm text-blue-700 space-y-3">
                        <li className="flex items-start gap-2">
                            <span className="bg-blue-200 text-blue-800 text-[10px] font-bold px-1.5 rounded-full mt-0.5">1</span>
                            <span>{t('infoPoint1')}</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="bg-blue-200 text-blue-800 text-[10px] font-bold px-1.5 rounded-full mt-0.5">2</span>
                            <span>{t('infoPoint2')}</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="bg-blue-200 text-blue-800 text-[10px] font-bold px-1.5 rounded-full mt-0.5">3</span>
                            <span>{t('infoPoint3')}</span>
                        </li>
                    </ul>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-2">{t('noInvoiceTitle')}</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        {t('noInvoiceDesc')}
                    </p>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}