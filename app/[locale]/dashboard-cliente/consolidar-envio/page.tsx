"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Plane, ArrowLeft, CheckCircle, CreditCard, Loader2, Info, Check, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { getProcessingFee } from '@/lib/stripeCalc';

// --- CONFIGURACIÓN DE LÍMITES ---
const MAX_WEIGHT_PER_BOX = 100; // Límite de 100 lbs por caja consolidada

// --- TARIFAS ---
// 🔥 CAMBIO 1: Renombramos 'ECONOMY' a 'GMC' (Gasp Maker Cargo)
const COURIER_RATES = {
    'DHL': { name: 'DHL Express', base: 45.00, perLb: 4.50, days: '2-4 días' },
    'FEDEX': { name: 'FedEx Priority', base: 40.00, perLb: 4.20, days: '3-5 días' },
    'GMC': { name: 'Gasp Maker Cargo', base: 15.00, perLb: 2.50, days: '7-10 días' }
};

export default function ConsolidateShipmentPage() {
  const router = useRouter();
  const paymentSectionRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<any[]>([]);
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<string>('');
  
  const [cards, setCards] = useState<any[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  const [isInventoryOpen, setIsInventoryOpen] = useState(true);

  // --- CARGAR DATOS ---
  useEffect(() => {
      const fetchData = async () => {
          try {
              const invRes = await fetch('/api/user/history');
              if(invRes.ok) {
                  const data = await invRes.json();
                  const ready = data.requests ? data.requests.filter((r: any) => r.status === 'RECIBIDO_MIAMI') : [];
                  setInventory(ready);
              }
              const cardsRes = await fetch('/api/user/cards');
              if(cardsRes.ok) {
                  const cData = await cardsRes.json();
                  setCards(cData.cards);
                  const def = cData.cards.find((c: any) => c.isDefault);
                  if (def) setSelectedCardId(def.id);
                  else if(cData.cards.length > 0) setSelectedCardId(cData.cards[0].id);
              }
          } catch(e) { console.error(e); } 
          finally { setLoading(false); }
      };
      fetchData();
  }, []);

  // --- AUTO-SCROLL ---
  useEffect(() => {
      if (selectedCourier && paymentSectionRef.current) {
          setTimeout(() => {
              paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
      }
  }, [selectedCourier]);

  // --- CÁLCULOS (AQUÍ ESTÁ LA LÓGICA DEL FEE) ---
  const calculateTotals = () => {
      const selectedPackages = inventory.filter(p => selectedIds.includes(p.id));
      const totalWeight = selectedPackages.reduce((sum, p) => sum + (p.weightLbs || 1), 0);
      
      let shippingCost = 0;
      if (selectedCourier && COURIER_RATES[selectedCourier as keyof typeof COURIER_RATES]) {
          const rate = COURIER_RATES[selectedCourier as keyof typeof COURIER_RATES];
          shippingCost = rate.base + (rate.perLb * totalWeight);
      }

      // Calculamos el Fee normal (basado en Stripe)
      let fee = shippingCost > 0 ? getProcessingFee(shippingCost) : 0;
      
      const isConsolidation = selectedPackages.length > 1;
      const isOverweight = totalWeight > MAX_WEIGHT_PER_BOX;

      // 🔥 CAMBIO 2: LÓGICA DE NEGOCIO
      // Si es Gasp Maker Cargo (GMC) Y es envío individual (NO consolidación) -> Fee = $0
      if (selectedCourier === 'GMC' && !isConsolidation) {
          fee = 0;
      }
      
      return { 
          count: selectedPackages.length,
          weight: totalWeight,
          shippingCost,
          fee,
          total: shippingCost + fee,
          isConsolidation,
          isOverweight 
      };
  };

  const totals = calculateTotals();

  // --- ACCIONES ---
  const togglePackage = (id: string) => {
      if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
      else setSelectedIds([...selectedIds, id]);
  };

  const handleCreateShipment = async () => {
      if(!selectedCourier || !selectedCardId || totals.isOverweight) return;
      setProcessing(true);

      try {
          const payRes = await fetch('/api/payments/charge', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  amountNet: totals.shippingCost + totals.fee, 
                  paymentMethodId: selectedCardId,
                  serviceType: totals.isConsolidation ? 'CONSOLIDATION' : 'SHIPPING_INTL',
                  description: `Envío Intl: ${totals.count} pqts (${totals.weight} lbs) vía ${selectedCourier}`
              })
          });
          const payData = await payRes.json();
          if(!payRes.ok) throw new Error(payData.message || "Error al cobrar");

          const shipRes = await fetch('/api/shipments/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  packageIds: selectedIds,
                  selectedCourier: COURIER_RATES[selectedCourier as keyof typeof COURIER_RATES].name,
                  courierService: selectedCourier,
                  totalWeight: totals.weight,
                  subtotal: totals.shippingCost,
                  processingFee: totals.fee,
                  totalPaid: totals.total,
                  stripePaymentId: payData.paymentId,
                  shippingAddress: "Dirección Principal (Perfil)" 
              })
          });

          if(shipRes.ok) {
              router.push('/dashboard-cliente/historial-solicitudes?tab=INTERNATIONAL'); 
          } else {
              alert("Error creando el registro de envío.");
          }

      } catch (error: any) {
          alert(error.message || "Error de proceso.");
      } finally {
          setProcessing(false);
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 font-montserrat">
      <div className="max-w-6xl mx-auto">
       
        <div className="flex items-center mb-6 md:mb-8">
            <Link href="/dashboard-cliente" className="text-gray-500 hover:text-gmc-dorado-principal mr-4"><ArrowLeft size={24} /></Link>
            <h1 className="text-xl md:text-2xl font-bold text-gmc-gris-oscuro font-garamond">Crear Envío Internacional</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
            {/* IZQUIERDA: INVENTARIO (PLEGABLE) Y COURIERS */}
            <div className="lg:col-span-2 space-y-6">
              
                {/* TARJETA INVENTARIO ACORDEÓN */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all">
                    <div 
                        onClick={() => setIsInventoryOpen(!isInventoryOpen)}
                        className="p-6 flex justify-between items-center cursor-pointer hover:bg-gray-50 bg-white"
                    >
                        <div>
                            <h3 className="font-bold text-gmc-gris-oscuro text-lg">Selecciona Paquetes</h3>
                            <p className="text-xs text-gray-500">{inventory.length} paquetes disponibles</p>
                        </div>
                        <div className="text-gray-400">
                            {isInventoryOpen ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                        </div>
                    </div>

                    {isInventoryOpen && (
                        <div className="p-6 pt-0 animate-fadeIn">
                            {selectedIds.length > 0 && (
                                <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <div className="flex justify-between text-xs font-bold mb-2">
                                        <span className={totals.isOverweight ? "text-red-500" : "text-gray-600"}>
                                            Peso Acumulado: {totals.weight.toFixed(1)} lbs
                                        </span>
                                        <span className="text-gray-400">Límite: {MAX_WEIGHT_PER_BOX} lbs</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div 
                                            className={`h-2.5 rounded-full transition-all ${totals.isOverweight ? "bg-red-500" : "bg-green-500"}`} 
                                            style={{ width: `${Math.min((totals.weight / MAX_WEIGHT_PER_BOX) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    {totals.isOverweight && (
                                        <p className="text-xs text-red-500 mt-2 flex items-center gap-1 font-bold">
                                            <AlertTriangle size={12}/> Excedes el límite de 100 lbs
                                        </p>
                                    )}
                                </div>
                            )}

                            {loading ? (
                                <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-gray-400"/></div>
                            ) : inventory.length === 0 ? (
                                <div className="text-center py-10 bg-gray-50 rounded-lg">
                                    <Package className="mx-auto text-gray-300 mb-2" size={32}/>
                                    <p className="text-gray-500">No tienes paquetes listos.</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin">
                                    {inventory.map((pkg) => (
                                        <div key={pkg.id} 
                                            onClick={() => togglePackage(pkg.id)}
                                            className={`flex items-center gap-3 p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedIds.includes(pkg.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
                                        >
                                            <div className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center ${selectedIds.includes(pkg.id) ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 bg-white'}`}>
                                                {selectedIds.includes(pkg.id) && <Check size={14} strokeWidth={4}/>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-800 text-sm truncate">{pkg.description || 'Sin descripción'}</p>
                                                <p className="text-xs text-gray-500 truncate">{pkg.gmcTrackingNumber || pkg.id}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="font-bold text-gray-700 text-sm">{pkg.weightLbs || 1} lb</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* OPCIONES DE COURIER */}
                {selectedIds.length > 0 && !totals.isOverweight && (
                    <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-200 animate-fadeIn">
                        <h3 className="font-bold text-gmc-gris-oscuro mb-4">Elige tu Servicio de Envío</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Object.entries(COURIER_RATES).map(([key, rate]) => {
                                const price = (rate.base + (rate.perLb * totals.weight)).toFixed(2);
                                return (
                                    <button 
                                        key={key}
                                        onClick={() => setSelectedCourier(key)}
                                        className={`group relative p-4 rounded-xl border-2 text-left transition-all ${selectedCourier === key ? 'border-gmc-dorado-principal bg-yellow-50 shadow-md ring-1 ring-yellow-200' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className={`p-2 rounded-full ${selectedCourier === key ? 'bg-white text-gmc-dorado-principal' : 'bg-gray-100 text-gray-400 group-hover:bg-white'}`}>
                                                <Plane size={20} />
                                            </div>
                                            <span className="text-[10px] font-bold bg-white px-2 py-1 rounded border border-gray-200 shadow-sm text-gray-500">
                                                {rate.days}
                                            </span>
                                        </div>
                                        
                                        <div className="flex flex-col gap-1">
                                            <p className="font-bold text-gray-800 text-sm leading-tight group-hover:text-black">
                                                {rate.name}
                                            </p>
                                            <p className={`text-lg font-mono font-bold ${selectedCourier === key ? 'text-gmc-dorado-principal' : 'text-gray-600'}`}>
                                                ${price}
                                            </p>
                                        </div>

                                        {selectedCourier === key && (
                                            <div className="absolute -top-2 -right-2 bg-gmc-dorado-principal text-white rounded-full p-1 shadow-sm">
                                                <Check size={12} strokeWidth={3}/>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* DERECHA: RESUMEN DE PAGO */}
            <div className="lg:col-span-1">
                <div ref={paymentSectionRef} className="bg-gmc-gris-oscuro text-white p-6 rounded-2xl shadow-xl sticky top-6 scroll-mt-6">
                    <h3 className="font-bold text-gmc-dorado-principal text-lg mb-6 border-b border-gray-600 pb-4">Resumen de Envío</h3>
                   
                    <div className="flex items-center gap-2 mb-4 bg-gray-700 p-3 rounded-lg">
                        <Package size={18} className="text-gmc-dorado-principal"/>
                        <span className="text-sm font-bold text-white">
                            {totals.count === 0 ? "Selecciona paquetes" : 
                             totals.isConsolidation ? `Consolidación (${totals.count} pqts)` : "Envío Individual"}
                        </span>
                    </div>

                    <div className="space-y-4 mb-6 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Peso Total</span>
                            <span className={totals.isOverweight ? "text-red-400 font-bold" : "text-white"}>{totals.weight.toFixed(2)} lbs</span>
                        </div>
                       
                        <div className="border-t border-gray-600 my-2"></div>
                       
                        <div className="flex justify-between items-center">
                            <span className="text-gray-300">Flete Internacional</span>
                            <span className="font-mono font-bold">${totals.shippingCost.toFixed(2)}</span>
                        </div>
                        
                        {/* MUESTRA FEE O GRATIS */}
                        <div className="flex justify-between items-center text-xs text-gray-400">
                            <span>Fee Procesamiento</span>
                            {totals.fee === 0 ? (
                                <span className="text-green-400 font-bold">GRATIS (GMC)</span>
                            ) : (
                                <span>+${totals.fee.toFixed(2)}</span>
                            )}
                        </div>

                        <div className="flex justify-between pt-4 border-t border-gray-600 text-xl font-bold">
                            <span>TOTAL</span>
                            <span className="text-gmc-dorado-principal">${totals.total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Método de Pago</label>
                        {cards.length > 0 ? (
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                {cards.map(card => (
                                    <label key={card.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedCardId === card.id ? 'bg-white text-black border-gmc-dorado-principal' : 'bg-gray-700 border-gray-600'}`}>
                                        <input type="radio" name="card" value={card.id} checked={selectedCardId === card.id} onChange={() => setSelectedCardId(card.id)} className="hidden" />
                                        <div className="bg-gray-200 text-black p-1 rounded text-[10px] font-bold uppercase w-10 text-center">{card.brand}</div>
                                        <div className="flex-1 text-sm font-mono truncate">•••• {card.last4}</div>
                                        {selectedCardId === card.id && <Check size={16} className="text-green-600 flex-shrink-0"/>}
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <Link href="/account-settings" className="block text-center p-3 bg-gray-700 rounded text-xs hover:bg-gray-600 text-white border border-gray-600">
                                + Agregar Tarjeta
                            </Link>
                        )}
                    </div>

                    <button 
                        onClick={handleCreateShipment}
                        disabled={processing || totals.total === 0 || !selectedCourier || totals.isOverweight}
                        className="w-full py-4 bg-gmc-dorado-principal text-gmc-gris-oscuro font-bold rounded-xl hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {processing ? <Loader2 className="animate-spin"/> : <Plane size={20}/>}
                        {processing ? 'Procesando...' : 'Pagar y Enviar'}
                    </button>
                   
                    {totals.isOverweight && (
                        <p className="text-xs text-center text-red-400 mt-3 font-bold animate-pulse">
                            ¡Excedes el límite de 100 lbs!
                        </p>
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}