"use client";

import React, { useState } from 'react';
import { 
  useStripe, 
  useElements, 
  CardNumberElement, 
  CardExpiryElement, 
  CardCvcElement 
} from '@stripe/react-stripe-js';
import { Loader2, CreditCard, Lock, Calendar, ShieldCheck } from 'lucide-react';

interface StripeCardFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function StripeCardForm({ onSuccess, onCancel }: StripeCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
        // 1. Pedir al servidor un "Permiso de Guardado" (SetupIntent)
        const res = await fetch('/api/user/setup-intent', { method: 'POST' });
        const { clientSecret } = await res.json();

        if (!clientSecret) throw new Error("Error de conexión con la pasarela de pagos.");

        // 2. Stripe valida la tarjeta directamente
        // 🔥 NOTA: Usamos CardNumberElement como referencia principal
        const cardElement = elements.getElement(CardNumberElement);
        if (!cardElement) throw new Error("Error inicializando el formulario.");

        const result = await stripe.confirmCardSetup(clientSecret, {
            payment_method: {
                card: cardElement,
            },
        });

        if (result.error) {
            throw new Error(result.error.message);
        }

        // 3. Si Stripe dice "OK", guardamos la referencia
        const saveRes = await fetch('/api/user/cards', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ paymentMethodId: result.setupIntent.payment_method })
        });

        if (!saveRes.ok) throw new Error("Error al guardar la tarjeta en el perfil.");

        // ¡Éxito!
        onSuccess();

    } catch (err: any) {
        console.error(err);
        setError(err.message || "Ocurrió un error inesperado.");
    } finally {
        setLoading(false);
    }
  };

  // Estilos personalizados GMC Standard
  const cardStyle = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1F2937', // gray-800
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: '500',
        '::placeholder': { color: '#9CA3AF' },
        iconColor: '#D4AF37', // Dorado GMC para el icono de la tarjeta
      },
      invalid: { color: '#DC2626', iconColor: '#DC2626' },
    },
  };

  // Clase base para los contenedores de los inputs
  const inputContainerClass = "p-3 bg-white border border-gray-300 rounded-xl shadow-sm transition-all focus-within:ring-2 focus-within:ring-gmc-dorado-principal focus-within:border-gmc-dorado-principal group";

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-6 border border-gray-100 rounded-2xl bg-gray-50/50 animate-fadeIn shadow-inner">
        <h3 className="text-sm font-bold text-gmc-gris-oscuro mb-5 flex items-center gap-2 border-b border-gray-200 pb-2">
            <CreditCard size={18} className="text-gmc-dorado-principal"/> Datos de la Tarjeta
        </h3>
        
        <div className="space-y-4 mb-6">
            {/* 1. NÚMERO DE TARJETA (Full Width) */}
            <div className={inputContainerClass}>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Número de Tarjeta</label>
                <div className="py-1">
                    <CardNumberElement options={{...cardStyle, showIcon: true}} />
                </div>
            </div>

            {/* 2. GRID PARA FECHA Y CVC */}
            <div className="grid grid-cols-2 gap-4">
                {/* Expiración */}
                <div className={inputContainerClass}>
                    <label className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                        <Calendar size={10} /> Vencimiento
                    </label>
                    <div className="py-1">
                        <CardExpiryElement options={cardStyle} />
                    </div>
                </div>

                {/* CVC */}
                <div className={inputContainerClass}>
                    <label className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                        <ShieldCheck size={10} /> CVC / CWW
                    </label>
                    <div className="py-1">
                        <CardCvcElement options={cardStyle} />
                    </div>
                </div>
            </div>
        </div>

        {error && (
            <div className="mb-5 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 font-bold flex items-center gap-2 animate-pulse">
                <ShieldCheck size={16}/> {error}
            </div>
        )}

        <div className="flex gap-3 pt-2">
            <button 
                type="submit" 
                disabled={!stripe || loading}
                className="flex-1 bg-gmc-gris-oscuro text-white py-3.5 rounded-xl font-bold text-sm hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:scale-100 flex justify-center items-center gap-2"
            >
                {loading ? <Loader2 size={18} className="animate-spin text-gmc-dorado-principal"/> : <Lock size={16} className="text-gmc-dorado-principal"/>}
                {loading ? "Procesando..." : "Guardar Tarjeta"}
            </button>
            <button 
                type="button" 
                onClick={onCancel}
                disabled={loading}
                className="px-6 py-3.5 bg-white text-gray-600 border border-gray-300 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors shadow-sm"
            >
                Cancelar
            </button>
        </div>
        
        <div className="mt-4 text-center">
            <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                <Lock size={10}/> Pagos procesados y encriptados nivel bancario por <strong>Stripe</strong>.
            </p>
        </div>
    </form>
  );
}