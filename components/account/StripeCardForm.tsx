"use client";

import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Loader2, CreditCard, Lock } from 'lucide-react';

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

        // 2. Stripe valida la tarjeta directamente (Los datos nunca tocan tu servidor)
        const result = await stripe.confirmCardSetup(clientSecret, {
            payment_method: {
                card: elements.getElement(CardElement)!,
            },
        });

        if (result.error) {
            throw new Error(result.error.message);
        }

        // 3. Si Stripe dice "OK", guardamos la referencia (token) en nuestra base de datos
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

  // Estilos personalizados para que el input de Stripe se vea como el resto de tu web
  const cardStyle = {
    style: {
      base: {
        fontSize: '16px',
        color: '#374151', // gray-700
        fontFamily: 'Montserrat, sans-serif',
        '::placeholder': { color: '#9CA3AF' },
      },
      invalid: { color: '#DC2626' },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-5 border border-blue-100 rounded-xl bg-blue-50/50 animate-fadeIn">
        <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <CreditCard size={18} className="text-blue-600"/> Datos de la Tarjeta
        </h3>
        
        <div className="p-3 bg-white border border-gray-300 rounded-lg mb-4 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
            <CardElement options={cardStyle}/>
        </div>

        {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded border border-red-100 font-bold">
                {error}
            </div>
        )}

        <div className="flex gap-3">
            <button 
                type="submit" 
                disabled={!stripe || loading}
                className="flex-1 bg-gmc-gris-oscuro text-white py-3 rounded-xl font-bold text-sm hover:bg-black transition-all shadow-md disabled:opacity-50 flex justify-center items-center gap-2"
            >
                {loading ? <Loader2 size={16} className="animate-spin"/> : <Lock size={16}/>}
                {loading ? "Procesando..." : "Guardar de forma segura"}
            </button>
            <button 
                type="button" 
                onClick={onCancel}
                disabled={loading}
                className="px-6 py-3 bg-white text-gray-600 border border-gray-300 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
            >
                Cancelar
            </button>
        </div>
        
        <div className="mt-3 text-center">
            <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                <Lock size={10}/> Pagos procesados y encriptados por <strong>Stripe</strong>.
            </p>
        </div>
    </form>
  );
}