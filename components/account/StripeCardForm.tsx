"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  useStripe, 
  useElements, 
  CardNumberElement, 
  CardExpiryElement, 
  CardCvcElement 
} from '@stripe/react-stripe-js';
import { Loader2, CreditCard, Lock, Calendar, ShieldCheck, AlertCircle } from 'lucide-react';

interface StripeCardFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function StripeCardForm({ onSuccess, onCancel }: StripeCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const params = useParams();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ========================================================================
  // 🌍 DICCIONARIO MULTILINGÜE AUTOMÁTICO (ES, EN, FR, PT)
  // ========================================================================
  // Detecta el idioma desde la URL. Si no es ninguno de los 4, usa español por defecto.
  const paramLocale = params?.locale as string;
  const locale = ['en', 'es', 'fr', 'pt'].includes(paramLocale) ? paramLocale : 'es';
  
  const dictionary: Record<string, any> = {
      es: {
          cardDetails: "Datos de la Tarjeta",
          cardNumber: "NÚMERO DE TARJETA",
          expiry: "VENCIMIENTO",
          cvc: "CVC / CWW",
          saveCard: "Guardar Tarjeta",
          cancel: "Cancelar",
          processing: "Procesando...",
          securityText: "Pagos procesados y encriptados nivel bancario por",
          errConnection: "Error de conexión con la pasarela de pagos.",
          errInit: "Error inicializando el formulario.",
          errSave: "Error al guardar la tarjeta en el perfil.",
          errUnknown: "Ocurrió un error inesperado."
      },
      en: {
          cardDetails: "Card Details",
          cardNumber: "CARD NUMBER",
          expiry: "EXPIRATION",
          cvc: "CVC / CWW",
          saveCard: "Save Card",
          cancel: "Cancel",
          processing: "Processing...",
          securityText: "Payments processed with bank-level encryption by",
          errConnection: "Connection error with the payment gateway.",
          errInit: "Error initializing the form.",
          errSave: "Error saving the card to your profile.",
          errUnknown: "An unexpected error occurred."
      },
      fr: {
          cardDetails: "Détails de la Carte",
          cardNumber: "NUMÉRO DE CARTE",
          expiry: "EXPIRATION",
          cvc: "CVC / CVV",
          saveCard: "Enregistrer la Carte",
          cancel: "Annuler",
          processing: "Traitement en cours...",
          securityText: "Paiements traités et cryptés au niveau bancaire par",
          errConnection: "Erreur de connexion avec la passerelle de paiement.",
          errInit: "Erreur lors de l'initialisation du formulaire.",
          errSave: "Erreur lors de l'enregistrement de la carte sur le profil.",
          errUnknown: "Une erreur inattendue est survenue."
      },
      pt: {
          cardDetails: "Detalhes do Cartão",
          cardNumber: "NÚMERO DO CARTÃO",
          expiry: "VALIDADE",
          cvc: "CVC / CVV",
          saveCard: "Salvar Cartão",
          cancel: "Cancelar",
          processing: "Processando...",
          securityText: "Pagamentos processados com criptografia de nível bancário por",
          errConnection: "Erro de conexão com o gateway de pagamento.",
          errInit: "Erro ao inicializar o formulário.",
          errSave: "Erro ao salvar o cartão no perfil.",
          errUnknown: "Ocorreu um erro inesperado."
      }
  };

  const t = dictionary[locale];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
        const res = await fetch('/api/user/setup-intent', { method: 'POST' });
        
        if (!res.ok) {
            throw new Error(t.errConnection);
        }

        const { clientSecret } = await res.json();

        if (!clientSecret) throw new Error(t.errConnection);

        const cardElement = elements.getElement(CardNumberElement);
        if (!cardElement) throw new Error(t.errInit);

        const result = await stripe.confirmCardSetup(clientSecret, {
            payment_method: {
                card: cardElement,
            },
        });

        if (result.error) {
            throw new Error(result.error.message);
        }

        const saveRes = await fetch('/api/user/cards', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ paymentMethodId: result.setupIntent.payment_method })
        });

        if (!saveRes.ok) throw new Error(t.errSave);

        onSuccess();

    } catch (err: any) {
        console.error(err);
        setError(err.message || t.errUnknown);
    } finally {
        setLoading(false);
    }
  };

  const cardStyle = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1F2937', 
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: '500',
        '::placeholder': { color: '#9CA3AF' },
        iconColor: '#D4AF37', 
      },
      invalid: { color: '#DC2626', iconColor: '#DC2626' },
    },
  };

  const inputContainerClass = "p-3 bg-white border border-gray-300 rounded-xl shadow-sm transition-all focus-within:ring-2 focus-within:ring-gmc-dorado-principal focus-within:border-gmc-dorado-principal group";

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-6 border border-gray-100 rounded-2xl bg-gray-50/50 animate-fadeIn shadow-inner">
        <h3 className="text-sm font-bold text-gmc-gris-oscuro mb-5 flex items-center gap-2 border-b border-gray-200 pb-2">
            <CreditCard size={18} className="text-gmc-dorado-principal"/> {t.cardDetails}
        </h3>
        
        <div className="space-y-4 mb-6">
            <div className={inputContainerClass}>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{t.cardNumber}</label>
                <div className="py-1">
                    <CardNumberElement options={{...cardStyle, showIcon: true}} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className={inputContainerClass}>
                    <label className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                        <Calendar size={10} /> {t.expiry}
                    </label>
                    <div className="py-1">
                        <CardExpiryElement options={cardStyle} />
                    </div>
                </div>

                <div className={inputContainerClass}>
                    <label className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                        <ShieldCheck size={10} /> {t.cvc}
                    </label>
                    <div className="py-1">
                        <CardCvcElement options={cardStyle} />
                    </div>
                </div>
            </div>
        </div>

        {error && (
            <div className="mb-5 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 font-bold flex items-center gap-2 animate-pulse">
                <AlertCircle size={16}/> {error}
            </div>
        )}

        <div className="flex gap-3 pt-2">
            <button 
                type="submit" 
                disabled={!stripe || loading}
                className="flex-1 bg-gmc-gris-oscuro text-white py-3.5 rounded-xl font-bold text-sm hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:scale-100 flex justify-center items-center gap-2"
            >
                {loading ? <Loader2 size={18} className="animate-spin text-gmc-dorado-principal"/> : <Lock size={16} className="text-gmc-dorado-principal"/>}
                {loading ? t.processing : t.saveCard}
            </button>
            <button 
                type="button" 
                onClick={onCancel}
                disabled={loading}
                className="px-6 py-3.5 bg-white text-gray-600 border border-gray-300 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors shadow-sm"
            >
                {t.cancel}
            </button>
        </div>
        
        <div className="mt-4 text-center">
            <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                <Lock size={10}/> {t.securityText} <strong>Stripe</strong>.
            </p>
        </div>
    </form>
  );
}