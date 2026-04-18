"use client";

import React, { useState } from 'react';
import { X, Lock, CreditCard, Plus, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';

interface SavedCard {
  id: string;
  last4: string;
  brand: string;
  country?: string; // 🔥 Agregamos country para la lógica Enterprise
}

interface MailboxCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName?: string;
  price?: number;
  savedCards?: SavedCard[];
  onSuccess?: () => void;
}

export default function MailboxCheckoutModal({
  isOpen,
  onClose,
  planName = 'Digital Basic',
  price = 7.99,
  savedCards = [],
  onSuccess,
}: MailboxCheckoutModalProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('MailboxSetup'); 
  const tBills = useTranslations('PendingBills'); // 🔥 Traemos las traducciones de la cajita azul
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string>(
    savedCards.length > 0 ? savedCards[0].id : ''
  );

  // ✅ NUEVA LÓGICA ENTERPRISE: Basada en la Tarjeta ✅
  const activeCardDetails = savedCards.find(c => c.id === selectedCardId);
  const isTrinidadCard = activeCardDetails?.country?.toUpperCase() === 'TT';
  const tasaTTD = 7.30;
  const montoTTD = (price * tasaTTD).toFixed(2);

  if (!isOpen) return null;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCardId) {
      setError(t('selectPaymentMethodError') || 'Por favor, selecciona un método de pago.');
      return;
    }

    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/payments/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountNet: price,
          paymentMethodId: selectedCardId,
          serviceType: 'MailboxSubscription', 
          description: `Pago GMC - ${planName}: ${price.toFixed(2)} USD`,
          planName: planName, 
          // ❌ Sin enviar isTrinidad. El backend decide.
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('paymentError') || 'Error al procesar el pago');
      }

      if (onSuccess) onSuccess();
      onClose();
      
    } catch (err: any) {
      setError(err.message || t('unexpectedError') || 'Ocurrió un error inesperado.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoToAddCard = () => {
    onClose(); 
    router.push(`/${locale}/account-settings`); 
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-[420px] bg-white rounded-[24px] shadow-2xl relative p-8">
        
        {/* Botón Cerrar (X) */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-full transition-colors disabled:opacity-50"
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        {/* Título y Precio */}
        <div className="text-center mb-8 mt-2">
          <h2 className="text-[22px] font-bold text-gray-900 font-garamond mb-2">
            {planName}
          </h2>
          <div className="flex items-baseline justify-center gap-1.5">
            <span className="text-[40px] leading-none font-extrabold text-black">
              ${price.toFixed(2)}
            </span>
            <span className="text-gray-500 font-medium text-lg">
              / {t('monthText') || 'mes'}
            </span>
          </div>
        </div>

        {/* Formulario y Tarjetas */}
        <div className="w-full space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2 border border-red-100">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {savedCards.length > 0 ? (
            <form onSubmit={handleCheckout} className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                  {t('savedCardsLabel') || 'Método de pago'}
                </label>
                
                {savedCards.map((card) => (
                  <label 
                    key={card.id} 
                    className={`flex items-center p-4 border rounded-2xl cursor-pointer transition-all ${
                      selectedCardId === card.id 
                        ? 'border-[#2A3342] bg-gray-50 ring-1 ring-[#2A3342]' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={card.id}
                      checked={selectedCardId === card.id}
                      onChange={(e) => setSelectedCardId(e.target.value)}
                      className="h-4 w-4 text-[#2A3342] focus:ring-[#2A3342] border-gray-300"
                    />
                    <div className="ml-3 flex items-center gap-3">
                      <CreditCard size={20} className="text-gray-400" />
                      <span className="text-base font-medium text-gray-700 tracking-wide uppercase">
                        •••• •••• •••• {card.last4}
                      </span>
                    </div>
                  </label>
                ))}
              </div>

              {/* 🔥 ALERTA PAGO LOCAL TRINIDAD (NIVEL ENTERPRISE) 🔥 */}
              {isTrinidadCard && price > 0 && (
                  <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-xl animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🇹🇹</span>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                        {tBills('localPaymentEnabled') || "Pago Local Habilitado"}
                      </p>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-2">
                      {tBills('localPaymentDesc') || "Cobro procesado en moneda local para evitar bloqueos del banco."} ({tBills('exchangeRateLabel') || "Tasa"}: 1 USD = {tasaTTD} TTD).
                    </p>
                    <div className="pt-2 border-t border-blue-500/20 flex justify-between text-sm font-black text-blue-600">
                      <span>{tBills('amountToCharge') || "Monto a cargar"}:</span>
                      <span>${montoTTD} TTD</span>
                    </div>
                  </div>
              )}

              {/* Botón Principal (Oscuro) */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 px-4 flex items-center justify-center rounded-[14px] text-white bg-[#2A3342] hover:bg-[#1a1f2e] transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2 text-base font-semibold">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {t('processing') || 'Procesando...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-base font-semibold tracking-wide">
                    <Lock size={16} />
                    {t('payBtn') || 'Pay'} ${price.toFixed(2)}
                  </span>
                )}
              </button>
            </form>
          ) : (
            
            /* ESTADO SIN TARJETAS */
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center">
                <CreditCard size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 font-medium">
                  {t('noCardsMessage') || 'No tienes tarjetas guardadas para realizar el pago.'}
                </p>
              </div>
              
              <button
                type="button"
                onClick={handleGoToAddCard}
                className="w-full py-4 px-4 flex items-center justify-center rounded-[14px] text-white bg-[#2A3342] hover:bg-[#1a1f2e] transition-colors shadow-md gap-2"
              >
                <Plus size={20} />
                <span className="text-base font-semibold tracking-wide">
                  {t('goToAddCard') || 'Go to Add Card'}
                </span>
              </button>
            </div>
          )}

          {/* Footer Stripe */}
          <div className="pt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400 font-medium">
            <Lock size={12} />
            <span>{t('encryptedByStripe') || 'Payment encrypted by Stripe'}</span>
          </div>

        </div>
      </div>
    </div>
  );
}