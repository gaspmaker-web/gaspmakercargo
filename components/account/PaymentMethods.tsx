"use client";

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { CreditCard, Plus, Trash2, ShieldCheck, Loader2, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl'; // 🔥 Importamos traducciones
import StripeCardForm from './StripeCardForm';

// ✅ RESTAURADO: Usamos la variable de entorno (Ahora funcionará perfectamente)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
  isBackup: boolean;
}

export default function PaymentMethods() {
  const t = useTranslations('PaymentSection'); // 🔥 Hook de traducción
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Función para obtener las tarjetas de tu BD
  const fetchCards = async () => {
    setLoading(true); // Aseguramos loading visual al recargar
    try {
        const res = await fetch('/api/user/cards');
        if (res.ok) {
            const data = await res.json();
            setCards(data.cards);
        }
    } catch (e) {
        console.error("Error cargando tarjetas", e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { fetchCards(); }, []);

  // Función para borrar tarjeta
  const deleteCard = async (id: string) => {
      if(!confirm(t('confirmDelete'))) return; // 🔥 Texto traducido
      
      // Optimistic UI
      setCards(prev => prev.filter(c => c.id !== id));

      try {
          await fetch('/api/user/cards', { 
              method: 'DELETE', 
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ cardId: id }) 
          });
          fetchCards(); // Recargamos para asegurar sincronización
      } catch (error) {
          console.error("Error eliminando tarjeta", error);
      }
  };

  // Función auxiliar para estilo de tarjeta (Diseño Profesional)
  const getCardStyle = (brand: string) => {
      const b = brand.toLowerCase();
      if (b.includes('visa')) return 'from-blue-900 to-blue-700';
      if (b.includes('master')) return 'from-gray-900 to-gray-800';
      return 'from-gmc-gris-oscuro to-gray-600';
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mt-8">
      
      {/* HEADER SECCIÓN */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
            <h2 className="text-xl font-bold text-gmc-gris-oscuro font-garamond flex items-center gap-2">
                <Wallet className="text-gmc-dorado-principal"/> {t('title')}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
        </div>
        
        {!showAddForm && (
            <button 
                onClick={() => setShowAddForm(true)}
                className="text-sm bg-black text-white px-5 py-2.5 rounded-xl font-bold hover:bg-gray-800 flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
                <Plus size={18}/> {t('addNew')}
            </button>
        )}
      </div>

      {/* LISTA DE TARJETAS (DISEÑO VISUAL PROFESIONAL) */}
      {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gmc-dorado-principal" size={32}/></div>
      ) : (
        <>
            {cards.length === 0 && !showAddForm && (
                <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <CreditCard className="mx-auto text-gray-300 mb-2" size={40}/>
                    <p className="text-gray-500 text-sm font-medium">{t('noCards')}</p>
                </div>
            )}
            
            {/* GRID DE TARJETAS */}
            {!showAddForm && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cards.map(card => (
                        <div 
                            key={card.id} 
                            className={`relative p-5 rounded-2xl text-white shadow-lg bg-gradient-to-br ${getCardStyle(card.brand)} transition-transform hover:-translate-y-1 hover:shadow-xl`}
                        >
                            {/* Decoración Fondo */}
                            <div className="absolute top-0 right-0 -mr-3 -mt-3 w-24 h-24 rounded-full bg-white opacity-10 blur-xl pointer-events-none"></div>
                            
                            <div className="flex justify-between items-start mb-6">
                                {/* Chip Simulado */}
                                <div className="w-10 h-7 bg-yellow-200/80 rounded-md border border-yellow-400/50 flex items-center justify-center overflow-hidden relative">
                                    <div className="absolute w-full h-[1px] bg-yellow-600/40 top-1/2"></div>
                                    <div className="absolute h-full w-[1px] bg-yellow-600/40 left-1/3"></div>
                                    <div className="absolute h-full w-[1px] bg-yellow-600/40 right-1/3"></div>
                                </div>
                                
                                <span className="uppercase font-bold tracking-widest text-lg italic opacity-90">
                                    {card.brand}
                                </span>
                            </div>

                            <div className="mb-4">
                                <p className="text-xl font-mono tracking-widest flex items-center gap-2">
                                    <span className="text-sm">•••• •••• ••••</span> {card.last4}
                                </p>
                            </div>

                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] text-gray-300 uppercase mb-0.5">{t('expires')}</p>
                                    <p className="font-mono text-sm">
                                        {card.expMonth.toString().padStart(2, '0')}/{card.expYear}
                                    </p>
                                </div>

                                {card.isDefault && (
                                    <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
                                        <ShieldCheck size={12} className="text-green-300" />
                                        <span className="text-[10px] font-bold tracking-wide">{t('defaultBadge')}</span>
                                    </div>
                                )}
                            </div>

                            {/* Botón Borrar Flotante */}
                            <button 
                                onClick={() => deleteCard(card.id)}
                                className="absolute bottom-4 right-4 p-2 bg-white/10 hover:bg-red-500/80 rounded-full text-white/70 hover:text-white transition-colors backdrop-blur-md"
                                title={t('delete')}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </>
      )}

      {/* FORMULARIO DE AGREGAR (Logica Original) */}
      {showAddForm && (
          <div className="mt-6 animate-in fade-in zoom-in-95 duration-200">
              <Elements stripe={stripePromise}>
                  <StripeCardForm 
                    onSuccess={() => { setShowAddForm(false); fetchCards(); }} 
                    onCancel={() => setShowAddForm(false)} 
                  />
              </Elements>
          </div>
      )}
    </div>
  );
}