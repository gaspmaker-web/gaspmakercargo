"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, CreditCard, Loader2, Check, ChevronDown, ChevronUp, DollarSign, AlertCircle, Package, Truck, Box, Ruler, Scale, ShieldCheck } from 'lucide-react';
import { getProcessingFee } from '@/lib/stripeCalc';
import { useTranslations } from 'next-intl';

// --- Helper para logos de Couriers ---
const getCarrierLogo = (carrier: string): string => {
  const c = carrier.toLowerCase();
  if (c.includes('fedex')) return '/fedex-express-6.svg';
  if (c.includes('dhl')) return '/dhl-1.svg';
  if (c.includes('ups')) return '/ups-united-parcel-service.svg';
  if (c.includes('usps')) return '/usps-logo.svg';
  return '/gaspmakercargoproject.png';
};

interface Rate {
    id: string; carrier: string; service: string; price: number; currency: string; days: string; logo?: string;
}

interface PendingBillsClientProps {
  bills: any[]; 
  locale: string;
  userProfile: any;
}

export default function PendingBillsClient({ bills: initialBills, locale, userProfile }: PendingBillsClientProps) {
  const t = useTranslations('PendingBills');
  const tPickup = useTranslations('Pickup'); 
  const tPackage = useTranslations('PackageDetail'); 

  const router = useRouter();
  const paymentSectionRef = useRef<HTMLDivElement>(null);

  // Estado de Datos
  const [bills, setBills] = useState<any[]>(initialBills || []);
  const [cards, setCards] = useState<any[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  
  // Estado de Proceso
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingRatesId, setLoadingRatesId] = useState<string | null>(null);
  
  // Estado de Selección y Tarifas
  const [selectedBillIds, setSelectedBillIds] = useState<string[]>([]);
  const [ratesMap, setRatesMap] = useState<Record<string, Rate[]>>({}); 
  const [selectedRateMap, setSelectedRateMap] = useState<Record<string, Rate>>({}); 

  // UX
  const [isBillsOpen, setIsBillsOpen] = useState(true);
  const [showMobileSummary, setShowMobileSummary] = useState(false);

  // 1. CARGAR TARJETAS
  useEffect(() => {
      const fetchCards = async () => {
          try {
              const res = await fetch('/api/user/cards');
              if (res.ok) {
                  const data = await res.json();
                  setCards(data.cards);
                  if (data.cards.length > 0) setSelectedCardId(data.cards[0].id);
              }
          } catch (e) { console.error(e); }
      };
      fetchCards();
  }, []);

  // 2. OBTENER TARIFAS (Cotizar)
  const handleGetRates = async (bill: any) => {
      if (!userProfile.address) { alert("⚠️ " + t('errorAddress')); return; }
      
      setLoadingRatesId(bill.id);
      try {
          const res = await fetch('/api/rates', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  weight: bill.weightLbs || 1,
                  dimensions: { 
                      length: bill.lengthIn || 10, width: bill.widthIn || 10, height: bill.heightIn || 10 
                  },
                  destination: { 
                      name: userProfile.name, address: userProfile.address, city: userProfile.cityZip, 
                      zip: userProfile.cityZip, country: userProfile.countryCode, phone: userProfile.phone
                  }
              })
          });
          
          const data = await res.json();
          if (res.ok && data.rates) {
              const processed = data.rates.map((r: Rate) => ({ ...r, logo: getCarrierLogo(r.carrier) }));
              if(processed.length === 0) processed.push({ id: 'std-gmc', carrier: 'Gasp Maker Cargo', service: 'Standard', price: (bill.weightLbs * 4.5) + 15, currency: 'USD', days: '5-7', logo: '/gaspmakercargoproject.png' });
              
              setRatesMap(prev => ({ ...prev, [bill.id]: processed }));
          } else {
              alert(t('errorGeneric') || "No rates found.");
          }
      } catch (e) { alert(t('errorConnection') || "Connection Error"); } 
      finally { setLoadingRatesId(null); }
  };

  // 3. SELECCIONAR TARIFA
  const handleSelectRate = (billId: string, rate: Rate) => {
      setSelectedRateMap(prev => ({ ...prev, [billId]: rate }));
      if (!selectedBillIds.includes(billId)) {
          setSelectedBillIds(prev => [...prev, billId]);
      }
  };

  // 4. CALCULAR TOTALES (INCLUYENDO SEGURO)
  const calculateTotals = () => {
      let serviceSubtotal = 0;
      let handlingSubtotal = 0; 
      let insuranceSubtotal = 0; // 🔥 ACUMULADOR DE SEGURO
      let count = 0;

      selectedBillIds.forEach(id => {
          const bill = bills.find(b => b.id === id);
          if (bill) {
              const handling = bill.handlingFee || 0;
              handlingSubtotal += handling;

              // 🔥 CÁLCULO DE SEGURO INDIVIDUAL
              // Leemos el valor declarado de la consolidación o paquete
              const val = Number(bill.declaredValue) || 0;
              // Si supera $100, cobramos el 3%
              const ins = val > 100 ? val * 0.03 : 0;
              insuranceSubtotal += ins;

              let itemServicePrice = 0;
              const rate = selectedRateMap[id];
              
              if (rate) {
                  itemServicePrice = rate.price;
              } else {
                  const totalFromServer = bill.totalAmount || 0;
                  // Si el total del servidor ya incluía handling/ins, los restamos para aislar el servicio base
                  itemServicePrice = Math.max(0, totalFromServer - handling - ins);
              }
              
              serviceSubtotal += itemServicePrice;
              count++;
          }
      });

      // Base Imponible = Servicio + Handling + Seguro
      const taxableAmount = serviceSubtotal + handlingSubtotal + insuranceSubtotal;
      const fee = getProcessingFee(taxableAmount);
      
      return { 
          serviceSubtotal, 
          handlingSubtotal, 
          insuranceSubtotal, // Devolvemos el total de seguro
          fee, 
          total: taxableAmount + fee, 
          count 
      };
  };

  const totals = calculateTotals();

  // "Service" para mostrar al cliente (incluye el fee de tarjeta oculto)
  const serviceWithFee = totals.serviceSubtotal + totals.fee;

  // 5. PAGAR
  const handlePay = async () => {
      if (totals.count === 0 || !selectedCardId) return;
      setIsProcessing(true);

      try {
          let selectedCourier = null;
          let courierService = null;

          if (selectedBillIds.length > 0) {
              const primaryId = selectedBillIds[0];
              const rate = selectedRateMap[primaryId];
              const originalBill = bills.find(b => b.id === primaryId);

              if (rate) {
                  selectedCourier = rate.carrier; 
                  courierService = rate.service;  
              } else {
                  const isStorePickup = originalBill?.serviceType === 'PICKUP' || 
                                        originalBill?.courierService === 'Entregar en Tienda';
                  if (isStorePickup) {
                      selectedCourier = 'CLIENTE_RETIRO';
                      courierService = 'Recogida en Tienda';
                  } else if (originalBill?.selectedCourier) {
                      selectedCourier = originalBill.selectedCourier;
                      courierService = originalBill.courierService;
                  } else {
                      selectedCourier = "Gasp Maker Cargo";
                  }
              }
          }

          const billsPayload = selectedBillIds.map(id => {
             const bill = bills.find(b => b.id === id);
             const rate = selectedRateMap[id];
             const handling = bill?.handlingFee || 0;
             
             // Recalcular seguro individual para enviarlo desglosado si fuera necesario
             const val = Number(bill?.declaredValue) || 0;
             const ins = val > 100 ? val * 0.03 : 0;
             
             let itemServicePrice = 0;
             if (rate) {
                 itemServicePrice = rate.price;
             } else {
                 const totalFromServer = bill?.totalAmount || 0;
                 itemServicePrice = Math.max(0, totalFromServer - handling - ins);
             }

             // Monto total por item (para registros internos)
             return {
                 id: id,
                 amount: itemServicePrice + handling + ins
             };
          });

          const allPackageIds = selectedBillIds.flatMap(billId => {
              const bill = bills.find(b => b.id === billId);
              if (bill && bill.packages && Array.isArray(bill.packages) && bill.packages.length > 0) {
                  return bill.packages.map((p: any) => p.id);
              }
              return [billId]; 
          });

          const payRes = await fetch('/api/payments/charge', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  amountNet: totals.total,
                  paymentMethodId: selectedCardId,
                  serviceType: 'BILL_PAYMENT',
                  description: `Pago Envíos (${totals.count})`,
                  packageIds: allPackageIds,
                  billDetails: billsPayload, 
                  billIds: selectedBillIds,          
                  selectedCourier: selectedCourier,  
                  courierService: courierService     
              })
          });
          
          if (!payRes.ok) {
              const errData = await payRes.json();
              throw new Error(errData.message || "Error en el pago.");
          }
          
          // --- ÉXITO: Actualización Inmediata del UI (El Fix) ---
          // 1. Quitamos los bills pagados de la lista visual
          setBills(prevBills => prevBills.filter(bill => !selectedBillIds.includes(bill.id)));
          
          // 2. Limpiamos selecciones
          setSelectedBillIds([]);
          setSelectedRateMap({});
          setRatesMap({});

          // 3. Refrescamos datos del servidor y navegamos
          router.refresh();
          router.push(`/${locale}/dashboard-cliente`);

      } catch (e: any) { 
          console.error(e);
          alert(e.message); 
      }
      finally { setIsProcessing(false); }
  };

  const toggleBill = (id: string) => {
      if (selectedBillIds.includes(id)) setSelectedBillIds(prev => prev.filter(i => i !== id));
      else setSelectedBillIds(prev => [...prev, id]);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-32 md:pb-0">
        
        {/* HEADER */}
        <div className="flex justify-center items-center py-4">
            <h1 className="text-2xl font-bold text-gmc-gris-oscuro font-garamond flex items-center gap-2">
                <FileText className="text-gmc-dorado-principal"/> {t('title')}
            </h1>
        </div>

        {bills.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
                <Check size={40} className="mx-auto text-green-500 mb-4"/>
                <h2 className="text-xl font-bold text-gray-800">{tPickup('successTitle')}</h2>
                <p className="text-gray-500 mb-6">{t('backDashboard')}</p>
                <Link href={`/${locale}/dashboard-cliente`} className="px-6 py-3 bg-gmc-gris-oscuro text-white rounded-lg font-bold">{t('backDashboard')}</Link>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LISTA DE FACTURAS */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        
                        <div onClick={() => setIsBillsOpen(!isBillsOpen)} className="p-4 flex justify-between items-center cursor-pointer bg-gray-50 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <span className="bg-red-100 text-red-600 p-1.5 rounded-full"><AlertCircle size={16}/></span>
                                <span className="font-bold text-gray-700 text-sm">{bills.length} {t('statusPending')}</span>
                            </div>
                            {isBillsOpen ? <ChevronUp size={18} className="text-gray-400"/> : <ChevronDown size={18} className="text-gray-400"/>}
                        </div>

                        {isBillsOpen && (
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/30">
                                {bills.map((bill) => {
                                    const isSelected = selectedBillIds.includes(bill.id);
                                    const rates = ratesMap[bill.id];
                                    const selectedRate = selectedRateMap[bill.id];
                                    
                                    const handling = bill.handlingFee || 0;
                                    
                                    // Datos para etiqueta visual en tarjeta individual
                                    const val = Number(bill.declaredValue) || 0;
                                    const ins = val > 100 ? val * 0.03 : 0;

                                    const displayPrice = selectedRate 
                                        ? selectedRate.price + handling + ins
                                        : (bill.totalAmount || 0);

                                    const isPickup = bill.serviceType === 'PICKUP' || 
                                                     bill.courierService === 'Entregar en Tienda' || 
                                                     bill.description?.toUpperCase().includes('PICKUP') ||
                                                     bill.gmcShipmentNumber?.toUpperCase().includes('PICKUP');

                                    const needsQuote = !isPickup && !selectedRate && (!bill.subtotalAmount || bill.subtotalAmount === 0);
                                    const showPriceInCard = isPickup || selectedRate || (bill.subtotalAmount > 0);

                                    return (
                                        <div key={bill.id} className={`relative bg-white p-4 rounded-xl border-2 transition-all shadow-sm flex flex-col ${isSelected ? 'border-gmc-dorado-principal ring-1 ring-orange-100' : 'border-gray-200'}`}>
                                            
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-start gap-3">
                                                    <div 
                                                        onClick={() => !needsQuote && toggleBill(bill.id)}
                                                        className={`w-5 h-5 mt-0.5 rounded border flex items-center justify-center cursor-pointer ${isSelected ? 'bg-gmc-dorado-principal border-gmc-dorado-principal text-white' : 'border-gray-300 bg-gray-50'}`}
                                                    >
                                                        {isSelected && <Check size={12} strokeWidth={3}/>}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-800 text-sm leading-tight">{bill.description || t('content')}</h3>
                                                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {bill.gmcShipmentNumber}</p>
                                                        {bill.packages && (
                                                            <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded mt-1 inline-block">
                                                                📦 {bill.packages.length} {t('packages')}
                                                            </span>
                                                        )}
                                                        {/* Etiquetas informativas pequeñas */}
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {handling > 0 && <span className="text-[9px] bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-200">Fee</span>}
                                                            {ins > 0 && <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">+Ins</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 mb-3">
                                                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-1 rounded text-[10px] font-bold border border-gray-200">
                                                    <Scale size={10}/> {bill.weightLbs} lb
                                                </span>
                                                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-1 rounded text-[10px] font-bold border border-gray-200">
                                                    <Ruler size={10}/> {bill.lengthIn}x{bill.widthIn}x{bill.heightIn}
                                                </span>
                                            </div>

                                            <div className="mt-auto pt-3 border-t border-gray-50">
                                                {needsQuote && !rates ? (
                                                    <button 
                                                        onClick={() => handleGetRates(bill)}
                                                        disabled={loadingRatesId === bill.id}
                                                        className="w-full py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition shadow-sm flex justify-center items-center gap-2"
                                                    >
                                                        {loadingRatesId === bill.id ? <Loader2 className="animate-spin" size={14}/> : <Truck size={14}/>}
                                                        {t('viewOptionsBtn')}
                                                    </button>
                                                ) : (
                                                    showPriceInCard ? (
                                                        <div className="flex justify-between items-end">
                                                            <div className="text-xs text-gray-500">
                                                                {isPickup ? (
                                                                    <span className="flex items-center gap-1 text-green-600 font-bold"><Box size={10}/> Pickup</span>
                                                                ) : selectedRate ? (
                                                                    <span className="flex items-center gap-1 text-blue-600 font-bold"><Truck size={10}/> {selectedRate.carrier}</span>
                                                                ) : t('totalToPay')}
                                                            </div>
                                                            <div className="text-xl font-bold text-gmc-gris-oscuro">${displayPrice.toFixed(2)}</div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center text-xs text-gray-400 py-2 italic">
                                                            {t('selectCourier')}
                                                        </div>
                                                    )
                                                )}
                                            </div>

                                            {rates && !selectedRate && (
                                                <div className="mt-3 space-y-2 animate-slideDown">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">{t('select')}:</p>
                                                    {rates.map(rate => (
                                                        <div 
                                                            key={rate.id} 
                                                            onClick={() => handleSelectRate(bill.id, rate)}
                                                            className="flex justify-between items-center p-2 border border-gray-200 rounded-lg hover:border-blue-400 cursor-pointer bg-gray-50 hover:bg-white transition-all"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {rate.logo ? <Image src={rate.logo} alt={rate.carrier} width={24} height={24} style={{objectFit:'contain'}}/> : <Truck size={14} className="text-gray-400"/>}
                                                                <div className="text-xs">
                                                                    <p className="font-bold text-gray-700">{rate.carrier}</p>
                                                                    <p className="text-[9px] text-gray-500">{rate.days}</p>
                                                                </div>
                                                            </div>
                                                            <span className="text-xs font-bold text-blue-700">${rate.price.toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* DERECHA: RESUMEN DE PAGO */}
                <div className="hidden lg:block lg:col-span-1">
                    <div ref={paymentSectionRef} className="bg-gmc-gris-oscuro text-white p-6 rounded-2xl shadow-xl sticky top-6">
                        <h3 className="font-bold text-gmc-dorado-principal text-lg mb-4 border-b border-gray-600 pb-2">{tPickup('summaryTitle')}</h3>
                        <div className="space-y-3 text-sm mb-6">
                            
                            {/* 1. Flete + Procesamiento */}
                            <div className="flex justify-between">
                                <span>Freight & Processing (GMC)</span>
                                <span className="font-bold">${serviceWithFee.toFixed(2)}</span>
                            </div>
                            
                            {/* 2. Handling Fee */}
                            {totals.handlingSubtotal > 0 && (
                                <div className="flex justify-between text-yellow-400">
                                    <span>Fee: Handling</span>
                                    <span className="font-bold">+${totals.handlingSubtotal.toFixed(2)}</span>
                                </div>
                            )}

                            {/* 3. 🔥 SEGURO (Visible si > 0) */}
                            {totals.insuranceSubtotal > 0 && (
                                <div className="flex justify-between text-blue-300">
                                    <span className="flex items-center gap-1"><ShieldCheck size={14}/> + Ins (3%)</span>
                                    <span className="font-bold">+${totals.insuranceSubtotal.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-600 text-gmc-dorado-principal">
                                <span>{tPickup('sumTotal')}</span>
                                <span>${totals.total.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <p className="text-xs font-bold text-gray-400 mb-2 uppercase">{tPickup('paymentTitle')}</p>
                            {cards.length > 0 ? (
                                <div className="bg-gray-700 p-3 rounded flex items-center justify-between border border-gray-600">
                                    <div className="flex items-center gap-2"><CreditCard size={16}/><span className="text-xs">•••• {cards.find(c => c.id === selectedCardId)?.last4}</span></div>
                                    <Link href={`/${locale}/account-settings`} className="text-xs text-gmc-dorado-principal">{tPickup('btnChange')}</Link>
                                </div>
                            ) : <Link href={`/${locale}/account-settings`} className="block text-center text-xs p-2 bg-gray-700 rounded text-white">+ Card</Link>}
                        </div>

                        <button onClick={handlePay} disabled={isProcessing || totals.count === 0} className="w-full py-3 bg-gmc-dorado-principal text-gmc-gris-oscuro font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-white transition-colors disabled:opacity-50">
                            {isProcessing ? <Loader2 className="animate-spin"/> : <DollarSign size={18}/>} {t('payNowBtn')}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* --- BARRA MÓVIL --- */}
        {bills.length > 0 && (
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50 flex items-center justify-between gap-4">
                <div onClick={() => setShowMobileSummary(!showMobileSummary)} className="flex-1 cursor-pointer">
                    <p className="text-[10px] text-gray-500 flex items-center gap-1 font-bold uppercase tracking-wide">
                        {tPickup('sumTotal')} ({totals.count}) {showMobileSummary ? <ChevronDown size={12}/> : <ChevronUp size={12}/>}
                    </p>
                    <p className="text-xl font-bold text-gmc-gris-oscuro">${totals.total.toFixed(2)}</p>
                </div>
                <button onClick={handlePay} disabled={isProcessing || totals.count === 0 || !selectedCardId} className="bg-gmc-gris-oscuro text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg disabled:opacity-50">
                    {isProcessing ? <Loader2 className="animate-spin" size={18}/> : <DollarSign size={18}/>} {tPickup('btnPay')}
                </button>
                
                {showMobileSummary && (
                    <div className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-lg animate-fadeIn text-sm text-gray-700 space-y-2 pb-6">
                        
                        <div className="flex justify-between">
                            <span>Freight & Processing</span>
                            <span>${serviceWithFee.toFixed(2)}</span>
                        </div>
                        
                        {totals.handlingSubtotal > 0 && (
                            <div className="flex justify-between text-yellow-600"><span>Fee: Handling</span><span>+${totals.handlingSubtotal.toFixed(2)}</span></div>
                        )}

                        {/* 🔥 SEGURO EN MÓVIL */}
                        {totals.insuranceSubtotal > 0 && (
                            <div className="flex justify-between text-blue-600"><span>+ Insurance (3%)</span><span>+${totals.insuranceSubtotal.toFixed(2)}</span></div>
                        )}

                        <div className="h-px bg-gray-100 my-2"></div>
                        <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                            <span className="text-xs flex items-center gap-2 font-bold"><CreditCard size={14}/> Card</span>
                            {cards.length > 0 ? <span className="font-mono text-xs">•••• {cards.find(c => c.id === selectedCardId)?.last4}</span> : <Link href={`/${locale}/account-settings`} className="text-xs text-blue-600 underline">Add</Link>}
                        </div>
                    </div>
                )}
            </div>
        )}
    </div>
  );
}