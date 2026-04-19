"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { AlertTriangle, Warehouse, DollarSign, RefreshCw, CreditCard, Plus } from 'lucide-react';
import type { Package, ConsolidatedShipment } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl'; // 🔥 Importamos las traducciones para la cajita azul
import AddCardModal from './AddCardModal'; 

interface StorageDebtBannerProps {
  packages: Package[];
  pendingBills: ConsolidatedShipment[];
}

export default function StorageDebtBanner({ packages, pendingBills }: StorageDebtBannerProps) {
  const router = useRouter();
  const tBills = useTranslations('PendingBills'); // 🔥 Traemos el diccionario de traducciones

  const [isPaying, setIsPaying] = useState(false);
  const [cards, setCards] = useState<any[]>([]); // 🔥 Guardamos TODA la data de las tarjetas
  const [hasCards, setHasCards] = useState<boolean>(true); 
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [loadingCards, setLoadingCards] = useState(true);

  // 1. Revisar si existen tarjetas al cargar
  const checkCards = async () => {
    try {
      const res = await fetch('/api/user/cards'); 
      if (res.ok) {
        const data = await res.json();
        setCards(data.cards || []); // 🔥 Guardamos el array completo (incluyendo el "country")
        setHasCards(data.cards && data.cards.length > 0);
      }
    } catch (e) { console.error(e); } finally { setLoadingCards(false); }
  };

  useEffect(() => { checkCards(); }, []);

  // 2. Calcular Deuda
  const debtDetails = useMemo(() => {
    let totalCost = 0;
    let overdueCount = 0;
    packages.forEach(pkg => {
        const debt = Number(pkg.storageDebt) || 0;
        if (debt > 0) { totalCost += debt; overdueCount++; }
    });
    return { totalCost, overdueCount };
  }, [packages]);

  // ✅ NUEVA LÓGICA ENTERPRISE: Basada en la Tarjeta Principal ✅
  const activeCardDetails = cards.length > 0 ? cards[0] : null;
  const isTrinidadCard = activeCardDetails?.country?.toUpperCase() === 'TT';
  const tasaTTD = 7.30;
  const montoTTD = (debtDetails.totalCost * tasaTTD).toFixed(2);

  // 3. Acción Inteligente
  const handleAction = async () => {
      // SI NO TIENE TARJETA -> Abrimos Modal
      if (!hasCards) {
          setShowAddCardModal(true);
          return;
      }

      // SI TIENE -> Pagamos
      setIsPaying(true);
      try {
          const res = await fetch('/api/payments/pay-storage', { method: 'POST' });
          if (res.ok) {
              alert("¡Pago exitoso! Tus paquetes han sido desbloqueados.");
              router.refresh(); 
          } else {
              const data = await res.json();
              // Si falla por falta de tarjeta, abrimos modal
              if (data.message?.includes("tarjeta") || res.status === 400) {
                  setHasCards(false);
                  setShowAddCardModal(true);
              } else {
                  alert(data.message || "Error al procesar el pago.");
              }
          }
      } catch (error) { alert("Error de conexión."); } finally { setIsPaying(false); }
  };

  // Cuando el modal termina con éxito
  const handleCardAddedSuccess = () => {
      setShowAddCardModal(false);
      checkCards(); // 🔥 Volvemos a buscar las tarjetas para tener el país actualizado
      alert("Tarjeta guardada con éxito. Procesando pago...");
      handleAction(); // Reintentamos el pago automáticamente
  };

  if (debtDetails.totalCost < 0.01) return null;

  return (
    <>
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 sm:p-6 mb-6 shadow-sm animate-in fade-in">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-start gap-4">
                <div className="bg-red-100 p-3 rounded-full text-red-600 hidden sm:block"><Warehouse size={32} /></div>
                <div>
                    <h3 className="text-lg sm:text-xl font-bold text-red-800 flex items-center gap-2">
                        <AlertTriangle size={24} className="text-red-600"/> Almacenaje Vencido ({debtDetails.overdueCount} Items)
                    </h3>
                    <p className="text-red-700 text-sm mt-1 max-w-xl">Tienes paquetes con costos de almacenaje diario. Servicio pausado.</p>
                </div>
            </div>

            <div className="text-center w-full md:w-auto bg-white/50 p-4 rounded-xl border border-red-100 min-w-[280px]">
                <p className="text-red-600 text-xs font-bold uppercase mb-1">Deuda Acumulada</p>
                <p className="text-3xl font-bold text-red-900 mb-4">${debtDetails.totalCost.toFixed(2)}</p>
                
                {/* 🔥 ALERTA PAGO LOCAL TRINIDAD (NIVEL ENTERPRISE) 🔥 */}
                {isTrinidadCard && debtDetails.totalCost > 0 && (
                    <div className="mb-4 p-3 bg-blue-900/10 border border-blue-500/30 rounded-xl text-left animate-in fade-in">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">🇹🇹</span>
                        <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wide">
                          {tBills('localPaymentEnabled') || "Pago Local Habilitado"}
                        </p>
                      </div>
                      <p className="text-[10px] text-gray-600 mb-2 leading-tight">
                        {tBills('localPaymentDesc') || "Cobro procesado en moneda local para evitar bloqueos del banco."} ({tBills('exchangeRateLabel') || "Tasa"}: 1 USD = {tasaTTD} TTD).
                      </p>
                      <div className="pt-2 border-t border-blue-500/20 flex justify-between text-xs font-black text-blue-700">
                        <span>{tBills('amountToCharge') || "Monto a cargar"}:</span>
                        <span>${montoTTD} TTD</span>
                      </div>
                    </div>
                )}
                
                <button 
                    onClick={handleAction}
                    disabled={isPaying || loadingCards}
                    className={`w-full text-white font-bold py-2.5 px-6 rounded-lg transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 ${
                        !hasCards ? "bg-[#222b3c] hover:bg-gray-800" : "bg-red-600 hover:bg-red-700"
                    }`}
                >
                    {isPaying ? <RefreshCw className="animate-spin" size={18}/> : !hasCards ? <Plus size={18}/> : <DollarSign size={18}/>} 
                    {isPaying ? "Procesando..." : !hasCards ? "Agregar Tarjeta y Pagar" : "Pagar Storage Ahora"}
                </button>
            </div>
        </div>
        </div>

        <AddCardModal isOpen={showAddCardModal} onClose={() => setShowAddCardModal(false)} onCardAdded={handleCardAddedSuccess} />
    </>
  );
}