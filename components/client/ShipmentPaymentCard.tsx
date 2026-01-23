'use client';

import { useState } from 'react';
import { CreditCard, Plus, Loader2, Check } from 'lucide-react';

// Definimos los tipos aquí para no depender de Prisma en el cliente
interface SimplePaymentMethod {
  id: string;
  brand: string;
  last4: string;
}

interface ShipmentPaymentCardProps {
  rate: {
    id: string;
    carrier: string;
    service: string;
    price: number;
    currency: string;
  } | null;
  savedCards: SimplePaymentMethod[];
  onPay: (cardId: string) => void;
  onAddCard: () => void; 
  isProcessing: boolean;
}

export default function ShipmentPaymentCard({ 
  rate, 
  savedCards, 
  onPay, 
  onAddCard,
  isProcessing 
}: ShipmentPaymentCardProps) {
  
  // Selecciona la primera tarjeta por defecto si existe
  const [selectedCardId, setSelectedCardId] = useState<string>(savedCards[0]?.id || '');

  if (!rate) {
    return (
      <div className="bg-gmc-gris-oscuro rounded-xl p-6 text-white text-center shadow-lg border border-gray-700">
        <div className="bg-gray-700/50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <CreditCard className="text-gray-400" size={24} />
        </div>
        <p className="text-gray-300 font-bold">Resumen de Pago</p>
        <p className="text-gray-500 text-xs mt-1">Selecciona una tarifa de la izquierda para continuar.</p>
      </div>
    );
  }

  // Cálculos Simples (Fee de procesamiento)
  const serviceFee = rate.price * 0.04; // 4% fee ejemplo
  const total = rate.price + serviceFee;

  return (
    <div className="bg-gmc-gris-oscuro rounded-xl p-6 shadow-2xl border border-gray-700 w-full text-white font-montserrat sticky top-6">
      
      {/* Título */}
      <h3 className="text-2xl font-bold text-gmc-dorado-principal mb-6 font-garamond border-b border-gray-600 pb-4">
        Resumen
      </h3>

      {/* Desglose */}
      <div className="space-y-3 mb-6 text-sm">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-200">Servicio ({rate.carrier})</span>
          <span className="font-bold">${rate.price.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-gray-400">
          <span>Distancia</span>
          <span>+$0.00</span>
        </div>
        <div className="flex justify-between items-center text-gray-400">
          <span>Fee Procesamiento</span>
          <span>+${serviceFee.toFixed(2)}</span>
        </div>
        
        <div className="border-t border-gray-600 my-4 pt-4 flex justify-between items-end">
          <span className="text-3xl font-bold text-gmc-dorado-principal">Total</span>
          <span className="text-3xl font-bold text-gmc-dorado-principal">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* SECCIÓN DE MÉTODO DE PAGO */}
      <div className="space-y-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">MÉTODO DE PAGO</p>

        {savedCards.length > 0 ? (
          // Opción A: Tiene tarjetas guardadas
          <div className="space-y-3">
             <div className="relative">
                <select 
                    value={selectedCardId}
                    onChange={(e) => setSelectedCardId(e.target.value)}
                    className="w-full bg-slate-800 text-white border border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gmc-dorado-principal outline-none appearance-none cursor-pointer"
                >
                    {savedCards.map((card) => (
                    <option key={card.id} value={card.id}>
                        •••• {card.last4} ({card.brand.toUpperCase()})
                    </option>
                    ))}
                </select>
                <div className="absolute right-3 top-3 text-gray-400 pointer-events-none">
                    <CreditCard size={16} />
                </div>
             </div>
             
             {/* Botón sutil para agregar otra */}
             <button 
                onClick={onAddCard}
                className="text-xs text-gmc-dorado-principal hover:text-white transition-colors flex items-center gap-1 ml-1"
             >
                <Plus size={12}/> Agregar nueva tarjeta
             </button>
          </div>
        ) : (
          // Opción B: NO tiene tarjetas (Botón grande)
          <button
            onClick={onAddCard}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-all border border-gray-600 shadow-inner group"
          >
            <div className="bg-slate-800 p-1 rounded group-hover:bg-slate-700"><Plus size={16} /></div>
            Agregar Tarjeta
          </button>
        )}

        {/* BOTÓN PAGAR */}
        <button
          onClick={() => onPay(selectedCardId)}
          disabled={isProcessing || (savedCards.length > 0 && !selectedCardId) || savedCards.length === 0}
          className={`w-full py-4 rounded-lg font-bold text-gmc-gris-oscuro flex items-center justify-center gap-2 shadow-lg transition-all mt-4
            ${(savedCards.length === 0 || isProcessing) 
              ? 'bg-gray-500 cursor-not-allowed opacity-50' 
              : 'bg-gmc-dorado-principal hover:bg-yellow-500 hover:scale-[1.02]'
            }
          `}
        >
          {isProcessing ? (
            <><Loader2 size={20} className="animate-spin"/> Procesando Pago...</>
          ) : (
            <><CreditCard size={20}/> Pagar Ahora</>
          )}
        </button>
        
        <p className="text-[10px] text-gray-500 text-center flex items-center justify-center gap-1">
            <Check size={10} /> Pagos seguros encriptados por Stripe
        </p>

      </div>
    </div>
  );
}