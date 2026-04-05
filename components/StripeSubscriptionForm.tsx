"use client";

import React, { useState } from 'react';
import { useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement } from '@stripe/react-stripe-js';
import { Loader2, Lock, Calendar, ShieldCheck, AlertCircle, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StripeSubscriptionFormProps {
  clientSecret: string;
  planName: string;
  price: string;
  onCancel: () => void;
  locale: string;
}

export default function StripeSubscriptionForm({ clientSecret, planName, price, onCancel, locale }: StripeSubscriptionFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Diccionario rápido para el modal (Puedes moverlo a tus .json luego si prefieres)
  const dict: Record<string, any> = {
    es: { pay: "Pagar", processing: "Procesando...", cancel: "Cancelar", err: "Error procesando el pago.", sec: "Pago encriptado por Stripe" },
    en: { pay: "Pay", processing: "Processing...", cancel: "Cancel", err: "Error processing payment.", sec: "Payment encrypted by Stripe" },
    pt: { pay: "Pagar", processing: "Processando...", cancel: "Cancelar", err: "Erro ao processar o pagamento.", sec: "Pagamento criptografado via Stripe" },
    fr: { pay: "Payer", processing: "Traitement...", cancel: "Annuler", err: "Erreur lors du paiement.", sec: "Paiement crypté par Stripe" }
  };
  const t = dict[locale] || dict['es'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardNumberElement);
      if (!cardElement) throw new Error("Error inicializando tarjeta.");

      // 🔥 Confirmamos el pago de la suscripción con Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      // ¡PAGO EXITOSO! Redirigimos al KYC
      router.push(`/${locale}/dashboard-cliente/mailbox-setup/kyc?status=success`);

    } catch (err: any) {
      setError(err.message || t.err);
      setLoading(false);
    }
  };

  const cardStyle = {
    style: {
      base: { fontSize: '16px', color: '#1F2937', fontFamily: 'Montserrat, sans-serif', fontWeight: '500', '::placeholder': { color: '#9CA3AF' }, iconColor: '#D4AF37' },
      invalid: { color: '#DC2626', iconColor: '#DC2626' },
    },
  };
  const inputContainerClass = "p-3 bg-white border border-gray-300 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-gmc-dorado-principal focus-within:border-gmc-dorado-principal";

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-1">{planName}</h3>
        <p className="text-3xl font-extrabold text-gmc-dorado-principal">${price} <span className="text-sm text-gray-500 font-medium">/ mes</span></p>
      </div>

      <div className="space-y-4 mb-6">
        <div className={inputContainerClass}>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Número de Tarjeta</label>
          <div className="py-1"><CardNumberElement options={{...cardStyle, showIcon: true}} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className={inputContainerClass}>
            <label className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1"><Calendar size={10} /> Vencimiento</label>
            <div className="py-1"><CardExpiryElement options={cardStyle} /></div>
          </div>
          <div className={inputContainerClass}>
            <label className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1"><ShieldCheck size={10} /> CVC</label>
            <div className="py-1"><CardCvcElement options={cardStyle} /></div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-5 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 font-bold flex items-center gap-2">
          <AlertCircle size={16}/> {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={!stripe || loading} className="flex-1 bg-gmc-gris-oscuro text-white py-3.5 rounded-xl font-bold text-sm hover:bg-black transition-all shadow-lg flex justify-center items-center gap-2">
          {loading ? <Loader2 size={18} className="animate-spin text-gmc-dorado-principal"/> : <Lock size={16} className="text-gmc-dorado-principal"/>}
          {loading ? t.processing : `${t.pay} $${price}`}
        </button>
        <button type="button" onClick={onCancel} disabled={loading} className="px-6 py-3.5 bg-white text-gray-600 border border-gray-300 rounded-xl font-bold text-sm hover:bg-gray-100">
          {t.cancel}
        </button>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1"><Lock size={10}/> {t.sec}</p>
      </div>
    </form>
  );
}