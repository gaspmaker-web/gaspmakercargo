'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, DollarSign, Clock, AlertTriangle, Box, Loader2, CreditCard, X, CheckCircle } from 'lucide-react';
// 🔥 1. Importamos el hook
import { useTranslations } from 'next-intl';

interface PaymentMethod {
    id: string;
    brand: string;
    last4: string;
}

interface Props {
  pkg: any;
  daysInWarehouse: number;
  overdueDays: number;
  cubicFeet: number;
  storageDebt: number;
  storageFreeDays: number;
  paymentMethods: PaymentMethod[];
}

export default function StorageLockScreen({ 
  pkg, daysInWarehouse, overdueDays, cubicFeet, storageDebt, storageFreeDays, paymentMethods 
}: Props) {
  // 🔥 2. Inicializamos traducciones
  const t = useTranslations('StorageLock'); 
  
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false); 
  const [selectedCard, setSelectedCard] = useState(paymentMethods[0]?.id || '');
  const router = useRouter();

  const handleProcessPayment = async () => {
    if (!selectedCard) {
        alert(t('alertSelectMethod')); // "Por favor selecciona un método de pago."
        return;
    }

    setLoading(true);

    try {
        const res = await fetch('/api/payments/pay-storage', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                packageId: pkg.id,
                amount: storageDebt,
                paymentMethodId: selectedCard
            })
        });

        const data = await res.json();

        if (res.ok) {
            // 🔥 ELIMINADO EL MENSAJE DE ÉXITO (ALERT)
            setShowPaymentModal(false);
            router.refresh(); 
        } else {
            alert(data.message || t('alertError')); // "❌ Error al procesar el pago."
        }
    } catch (error) {
        console.error(error);
        alert(t('alertConnection')); // "Error de conexión."
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 font-montserrat flex justify-center items-center relative">
        
        {/* ================= MODAL DE PAGO (SELECCIÓN DE TARJETA) ================= */}
        {showPaymentModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <CreditCard size={20}/> {t('paymentMethodTitle')}
                        </h3>
                        <button onClick={() => setShowPaymentModal(false)} disabled={loading} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>
                    
                    <div className="p-6">
                        <div className="text-center mb-6">
                            <p className="text-sm text-gray-500 mb-1">{t('totalToPay')}</p>
                            <p className="text-3xl font-black text-gray-900">${storageDebt.toFixed(2)}</p>
                        </div>

                        <p className="text-xs font-bold text-gray-500 uppercase mb-3">{t('savedCards')}</p>
                        <div className="space-y-3 mb-6">
                            {paymentMethods.length > 0 ? (
                                paymentMethods.map((pm) => (
                                    <label 
                                        key={pm.id}
                                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedCard === pm.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-200'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="radio" 
                                                name="paymentMethod" 
                                                value={pm.id}
                                                checked={selectedCard === pm.id}
                                                onChange={() => setSelectedCard(pm.id)}
                                                className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                                            />
                                            <div className="flex items-center gap-2">
                                                <div className="bg-gray-100 p-1.5 rounded">
                                                    <CreditCard size={16} className="text-gray-600"/>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800 capitalize">{pm.brand}</p>
                                                    <p className="text-xs text-gray-500">•••• {pm.last4}</p>
                                                </div>
                                            </div>
                                        </div>
                                        {selectedCard === pm.id && <CheckCircle size={18} className="text-blue-500" />}
                                    </label>
                                ))
                            ) : (
                                <p className="text-sm text-red-500 text-center p-4 border border-red-100 rounded-lg bg-red-50">
                                    {t('noCards')}
                                </p>
                            )}
                        </div>

                        <button 
                            onClick={handleProcessPayment}
                            disabled={loading || paymentMethods.length === 0 || !selectedCard}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18}/> : <DollarSign size={18}/>}
                            {loading ? t('processing') : `${t('payBtn')} $${storageDebt.toFixed(2)}`}
                        </button>
                    </div>
                </div>
            </div>
        )}


        {/* ================= PANTALLA PRINCIPAL DE BLOQUEO ================= */}
        <div className={`max-w-lg w-full bg-white rounded-3xl shadow-2xl border border-red-100 overflow-hidden relative animate-in zoom-in-95 duration-300 ${showPaymentModal ? 'blur-sm' : ''}`}>
            
            {/* Cabecera Roja */}
            <div className="bg-red-600 p-8 text-white text-center relative overflow-hidden">
                <div className="absolute top-[-20px] right-[-20px] opacity-10 rotate-12"><Lock size={140}/></div>
                <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md shadow-inner border border-white/30">
                    <Lock size={40} />
                </div>
                <h1 className="text-2xl font-black uppercase tracking-widest">{t('title')}</h1>
                <p className="text-red-100 text-sm mt-1 font-medium bg-red-800/30 inline-block px-3 py-1 rounded-full">
                    {t('subtitle')}
                </p>
            </div>

            <div className="p-8">
                {/* Explicación */}
                <div className="text-center mb-8">
                    <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                        {t.rich('description', {
                            days: daysInWarehouse,
                            limit: storageFreeDays,
                            strong: (chunks) => <strong className="text-gray-900">{chunks}</strong>
                        })}
                    </p>
                    
                    <p className="text-xs text-red-500 font-bold mb-6 bg-red-50 p-3 rounded-lg border border-red-100 flex items-start gap-2 text-left">
                       <AlertTriangle size={16} className="min-w-[16px] mt-0.5"/>
                       <span>{t('restriction')}</span>
                    </p>
                    
                    {/* Resumen de Costos */}
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 shadow-sm text-left">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">{t('labelTracking')}</span>
                            <span className="text-xs font-mono font-bold text-gray-600">{pkg.gmcTrackingNumber}</span>
                        </div>
                        
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">{t('labelVolume')} (ft³)</span>
                            <span className="text-xs font-bold text-gray-700 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-gray-200">
                                <Box size={12} className="text-blue-500"/> {cubicFeet.toFixed(3)} ft³
                            </span>
                        </div>

                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">{t('labelDaysToPay')}</span>
                            <span className="text-sm font-bold text-red-600 flex items-center gap-1">
                                <Clock size={14}/> +{overdueDays} {t('days')}
                            </span>
                        </div>
                        
                        <div className="w-full h-px bg-gray-200 my-3"></div>
                        
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-extrabold text-gray-800 uppercase">{t('labelTotal')}</span>
                            <span className="text-3xl font-black text-gray-900 tracking-tight">${storageDebt.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* BOTÓN PRINCIPAL */}
                <button 
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-base shadow-lg hover:shadow-red-200 transition-all flex items-center justify-center gap-2 mb-4 active:scale-[0.98]"
                >
                    <DollarSign size={20}/> {t('payNowBtn')}
                </button>

                <Link 
                    href="/dashboard-cliente"
                    className="block w-full text-center py-2 text-gray-400 text-xs font-bold hover:text-gray-600 transition-colors uppercase tracking-wider"
                >
                    {t('backToDashboard')}
                </Link>
            </div>
        </div>
    </div>
  );
}