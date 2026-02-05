"use client";

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, CreditCard, Lock, Loader2 } from 'lucide-react';

// Cargar Stripe con la LLAVE LIVE DIRECTA (Solución al error Test Mode)
const stripePromise = loadStripe("pk_live_T0abxWmSgNZQ7dDDm6U3Rk8A00PwAsynLw");

// --- FORMULARIO INTERNO ---
function CardForm({ onSuccess, onCancel }: { onSuccess: () => void, onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    // 1. Confirmar setup con Stripe
    const { setupIntent, error: setupError } = await stripe.confirmSetup({
      elements,
      redirect: 'if_required', 
      confirmParams: {
        return_url: `${window.location.origin}/dashboard-cliente`,
      },
    });

    if (setupError) {
      setError(setupError.message || "Error al validar tarjeta.");
      setLoading(false);
      return;
    }

    // 2. Guardar en Base de Datos si Stripe aprobó
    if (setupIntent && setupIntent.status === 'succeeded') {
        try {
            const saveRes = await fetch('/api/user/cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    paymentMethodId: setupIntent.payment_method 
                })
            });

            if (saveRes.ok) {
                onSuccess();
            } else {
                setError("Tarjeta válida, pero error al guardar en perfil.");
            }
        } catch (err) {
            setError("Error de conexión al guardar.");
        }
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Contenedor del Elemento Stripe con estilos limpios */}
      <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      
      {error && (
        <div className="text-red-600 text-xs sm:text-sm bg-red-50 p-3 rounded-lg flex items-center gap-2">
          <Lock size={14} className="flex-shrink-0" /> <span>{error}</span>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button 
          type="button" 
          onClick={onCancel}
          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition text-sm sm:text-base"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          disabled={!stripe || loading}
          className="flex-1 px-4 py-3 bg-[#222b3c] text-white font-bold rounded-xl hover:bg-gray-800 transition flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base shadow-lg"
        >
          {loading ? <Loader2 className="animate-spin" size={18}/> : <CreditCard size={18}/>}
          Guardar
        </button>
      </div>
    </form>
  );
}

// --- MODAL PRINCIPAL ---
export default function AddCardModal({ isOpen, onClose, onCardAdded }: { isOpen: boolean, onClose: () => void, onCardAdded: () => void }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/user/cards/setup', { method: 'POST' })
        .then(r => r.json())
        .then(data => {
            if(data.clientSecret) setClientSecret(data.clientSecret);
        })
        .catch(console.error);
    } else {
        setClientSecret(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
      {/* MEJORAS MÓVIL: 
         - w-[95%]: Deja un margen pequeño en móviles.
         - max-h-[90vh]: Evita que sea más alto que la pantalla.
         - overflow-y-auto: Permite scroll si el teclado tapa contenido.
      */}
      <div className="bg-white w-[95%] sm:w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative max-h-[90vh] flex flex-col">
        
        {/* Header Fijo */}
        <div className="bg-[#222b3c] p-4 flex justify-between items-center text-white flex-shrink-0">
          <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
            <CreditCard size={20} className="text-[#EAD8B1]"/> Nueva Tarjeta
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition p-1"><X size={24}/></button>
        </div>

        {/* Cuerpo Scroleable */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          <p className="text-xs sm:text-sm text-gray-500 mb-5 leading-relaxed">
            Ingresa los datos para procesar el pago. Se guardará de forma segura mediante encriptación SSL.
          </p>

          {clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', labels: 'floating' } }}>
              <CardForm onSuccess={onCardAdded} onCancel={onClose} />
            </Elements>
          ) : (
            <div className="flex justify-center py-10 text-gray-400">
              <Loader2 className="animate-spin" size={32}/>
            </div>
          )}
        </div>
        
        {/* Footer Seguridad */}
        <div className="bg-gray-50 p-3 text-center border-t border-gray-100 flex-shrink-0">
          <p className="text-[10px] sm:text-xs text-gray-400 flex items-center justify-center gap-1">
            <Lock size={10}/> Pagos seguros vía Stripe 256-bit SSL
          </p>
        </div>
      </div>
    </div>
  );
}