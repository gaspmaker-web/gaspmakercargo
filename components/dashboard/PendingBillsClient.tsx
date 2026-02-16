"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
    FileText, CreditCard, Loader2, Check, CheckCircle, ChevronDown, ChevronUp, 
    DollarSign, AlertCircle, Package, Truck, Box, Ruler, Scale, ShieldCheck, 
    ExternalLink, Plus, Clock, Info, Tag, XCircle 
} from 'lucide-react';
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

// --- Helper para nombres limpios ---
const cleanCarrierName = (name: string) => {
  if (!name) return '';
  const n = name.toLowerCase();
  if (n.includes('fedex')) return 'FedEx';
  if (n.includes('ups')) return 'UPS';
  if (n.includes('dhl')) return 'DHL';
  if (n.includes('usps')) return 'USPS';
  if (n.includes('gasp') || n.includes('gmc')) return 'Gasp Maker Cargo';
  return name;
};

// 🔥 NUEVO HELPER PARA SERVICIOS
const cleanServiceName = (name: string) => {
  if (!name) return '';
  return name
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace('Fedex', '')
    .replace('Ups', '')
    .trim();
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

  // --- CUPONES ---
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState({ type: "", text: "" });
  const [validatingCoupon, setValidatingCoupon] = useState(false);

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
              // Fallback si no hay tarifas
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

  // 🔥 4. CALCULAR TOTALES
  const calculateTotals = () => {
      let serviceSubtotal = 0;
      let handlingSubtotal = 0; 
      let insuranceSubtotal = 0; 
      let count = 0;

      selectedBillIds.forEach(id => {
          const bill = bills.find(b => b.id === id);
          if (bill) {
              const isConsolidated = bill.serviceType === 'CONSOLIDATION' || 
                                     bill.description?.toLowerCase().includes('consolid') ||
                                     (bill.packages && bill.packages.length > 1);
              
              const dynamicHandling = isConsolidated ? 10.00 : 0.00;
              handlingSubtotal += dynamicHandling;

              const val = Number(bill.declaredValue) || 0;
              const ins = val > 100 ? val * 0.03 : 0;
              insuranceSubtotal += ins;

              let itemServicePrice = 0;
              const rate = selectedRateMap[id];
              
              if (rate) {
                  itemServicePrice = rate.price;
              } else {
                  const totalFromServer = bill.totalAmount || 0;
                  itemServicePrice = Math.max(0, totalFromServer - (bill.handlingFee || 0) - ins);
              }
              
              serviceSubtotal += itemServicePrice;
              count++;
          }
      });

      const taxableAmount = serviceSubtotal + handlingSubtotal + insuranceSubtotal;
      const fee = getProcessingFee(taxableAmount);
      
      // Aplicar descuento
      const total = Math.max(0, taxableAmount + fee - discount);
      
      return { 
          serviceSubtotal, 
          handlingSubtotal, 
          insuranceSubtotal, 
          fee, 
          total, 
          count 
      };
  };

  const totals = calculateTotals();

  // 🔥 MANEJO DE CUPÓN
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    if (totals.count === 0) { setCouponMsg({ type: "error", text: "Select items first." }); return; }

    setValidatingCoupon(true);
    setCouponMsg({ type: "", text: "" });
    setDiscount(0);

    if (totals.serviceSubtotal < 100) {
      setTimeout(() => {
        setCouponMsg({ type: "error", text: "Give $25, Get $25: Valid only on shipments over $100 USD." });
        setValidatingCoupon(false);
      }, 600);
      return;
    }

    setTimeout(() => {
      setDiscount(25.0);
      setCouponMsg({ type: "success", text: "Referral Credit applied! (-$25.00)" });
      setValidatingCoupon(false);
    }, 800);
  };

  // 5. PAGAR
  const handlePay = async () => {
      // 🔥 UX MEJORADA: Si no hay tarjeta, abrir menú
      if (!selectedCardId) {
          setShowMobileSummary(true); 
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
          return;
      }

      if (totals.count === 0) return;
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
             
             const isConsolidated = bill?.serviceType === 'CONSOLIDATION' || 
                                    bill?.description?.toLowerCase().includes('consolid') ||
                                    (bill?.packages && bill?.packages.length > 1);
             const dynamicHandling = isConsolidated ? 10.00 : 0.00;

             const val = Number(bill?.declaredValue) || 0;
             const ins = val > 100 ? val * 0.03 : 0;
             
             let itemServicePrice = 0;
             if (rate) {
                 itemServicePrice = rate.price;
             } else {
                 const totalFromServer = bill?.totalAmount || 0;
                 itemServicePrice = Math.max(0, totalFromServer - (bill.handlingFee || 0) - ins);
             }

             return {
                 id: id,
                 amount: itemServicePrice + dynamicHandling + ins
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
                  description: `Pago Envíos (${totals.count}) ${discount > 0 ? "(Promo Applied)" : ""}`,
                  packageIds: allPackageIds,
                  billDetails: billsPayload, 
                  billIds: selectedBillIds,          
                  selectedCourier: selectedCourier,  
                  courierService: courierService,
                  discountApplied: discount     
              })
          });
          
          if (!payRes.ok) {
              const errData = await payRes.json();
              throw new Error(errData.message || "Error en el pago.");
          }
          
          setBills(prevBills => prevBills.filter(bill => !selectedBillIds.includes(bill.id)));
          setSelectedBillIds([]);
          setSelectedRateMap({});
          setRatesMap({});
          setDiscount(0);
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

  const handleAddCardRedirect = () => {
    router.push(`/${locale}/account-settings?tab=billing`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-40 lg:pb-10 font-montserrat">
        
        {/* HEADER */}
        <div className="flex justify-center items-center py-6">
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
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        
                        {/* ALERTA DE PENDIENTES */}
                        <div onClick={() => setIsBillsOpen(!isBillsOpen)} className="p-5 flex justify-between items-center cursor-pointer bg-white border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <span className="bg-red-50 text-red-600 p-2 rounded-full border border-red-100"><AlertCircle size={18}/></span>
                                <span className="font-bold text-gray-800 text-sm">{bills.length} {t('statusPending')}</span>
                            </div>
                            {isBillsOpen ? <ChevronUp size={18} className="text-gray-400"/> : <ChevronDown size={18} className="text-gray-400"/>}
                        </div>

                        {isBillsOpen && (
                            <div className="p-5 grid grid-cols-1 gap-6 bg-gray-50/50">
                                {bills.map((bill) => {
                                    const isSelected = selectedBillIds.includes(bill.id);
                                    const rates = ratesMap[bill.id];
                                    const selectedRate = selectedRateMap[bill.id];
                                    
                                    const isConsolidated = bill.serviceType === 'CONSOLIDATION' || 
                                                           bill.description?.toLowerCase().includes('consolid') ||
                                                           (bill.packages && bill.packages.length > 1);
                                    const effectiveHandling = isConsolidated ? 10.00 : 0.00;

                                    const val = Number(bill.declaredValue) || 0;
                                    const ins = val > 100 ? val * 0.03 : 0;

                                    const displayPrice = selectedRate 
                                        ? selectedRate.price + effectiveHandling + ins
                                        : (bill.totalAmount || 0);

                                    const isPickup = bill.serviceType === 'PICKUP' || 
                                                     bill.courierService === 'Entregar en Tienda' || 
                                                     bill.description?.toUpperCase().includes('PICKUP');

                                    const needsQuote = !isPickup && !selectedRate && (!bill.subtotalAmount || bill.subtotalAmount === 0);
                                    
                                    return (
                                        <div key={bill.id} className={`relative bg-white p-5 rounded-2xl border-2 transition-all shadow-sm flex flex-col ${isSelected ? 'border-gmc-dorado-principal ring-2 ring-yellow-50/50' : 'border-gray-100 hover:border-gray-300'}`}>
                                            
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-start gap-4">
                                                    <div 
                                                        onClick={() => !needsQuote && toggleBill(bill.id)}
                                                        className={`w-6 h-6 mt-1 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-colors ${isSelected ? 'bg-gmc-dorado-principal border-gmc-dorado-principal text-white' : 'border-gray-300 bg-gray-50'}`}
                                                    >
                                                        {isSelected && <Check size={14} strokeWidth={4}/>}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-800 text-base leading-tight">{bill.description || t('content')}</h3>
                                                        <p className="text-[11px] text-gray-400 font-mono mt-1 uppercase tracking-wider">ID: {bill.gmcShipmentNumber}</p>
                                                        
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {bill.packages && (
                                                                <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold">
                                                                    📦 {bill.packages.length} {t('packages')}
                                                                </span>
                                                            )}
                                                            {effectiveHandling > 0 && <span className="text-[10px] bg-yellow-50 text-yellow-700 px-2 py-1 rounded font-bold border border-yellow-100">Fee $10</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-3 mb-5 pl-10">
                                                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200">
                                                    <Scale size={12}/> {bill.weightLbs} lb
                                                </span>
                                                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200">
                                                    <Ruler size={12}/> {bill.lengthIn}x{bill.widthIn}x{bill.heightIn}
                                                </span>
                                            </div>

                                            <div className="pl-0 sm:pl-2">
                                                {needsQuote && !rates ? (
                                                    <button 
                                                        onClick={() => handleGetRates(bill)}
                                                        disabled={loadingRatesId === bill.id}
                                                        className="w-full py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition shadow-md flex justify-center items-center gap-2"
                                                    >
                                                        {loadingRatesId === bill.id ? <Loader2 className="animate-spin" size={16}/> : <Truck size={16}/>}
                                                        {t('viewOptionsBtn')}
                                                    </button>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {/* SI YA SELECCIONÓ UNO (Tarjeta Resumida) */}
                                                        {isSelected && selectedRate ? (
                                                            <div className="bg-white border border-gmc-dorado-principal rounded-xl p-4 shadow-sm animate-fadeIn">
                                                                <div className="flex justify-between items-center mb-3">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 bg-gray-50 rounded-lg p-1 border border-gray-100 flex items-center justify-center">
                                                                            <Image src={selectedRate.logo || '/gaspmakercargoproject.png'} alt="Courier" width={32} height={32} className="object-contain"/>
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-bold text-gray-800 text-sm">{cleanCarrierName(selectedRate.carrier)}</p>
                                                                            <p className="text-[10px] text-gray-500">{cleanServiceName(selectedRate.service)}</p>
                                                                            <p className="text-[10px] text-gray-400 mt-0.5">{selectedRate.days}</p>
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-xl font-bold text-gmc-gris-oscuro">${displayPrice.toFixed(2)}</p>
                                                                </div>
                                                                
                                                                <div className="border-t border-gray-100 pt-2 mt-2 space-y-1">
                                                                    <div className="flex justify-between text-xs text-gray-500">
                                                                        <span>Freight Cost</span><span>${selectedRate.price.toFixed(2)}</span>
                                                                    </div>
                                                                    {effectiveHandling > 0 && (
                                                                        <div className="flex justify-between text-xs text-yellow-600">
                                                                            <span>Consolidation Fee</span><span>+${effectiveHandling.toFixed(2)}</span>
                                                                        </div>
                                                                    )}
                                                                    {ins > 0 && (
                                                                        <div className="flex justify-between text-xs text-blue-600">
                                                                            <span>Insurance</span><span>+${ins.toFixed(2)}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            /* LISTA DE OPCIONES DISPONIBLES */
                                                            rates && (
                                                                <div className="animate-slideDown">
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider">{t('select')}:</p>
                                                                    <div className="space-y-2">
                                                                        {rates.map(rate => (
                                                                            <div 
                                                                                key={rate.id} 
                                                                                onClick={() => handleSelectRate(bill.id, rate)}
                                                                                className="flex justify-between items-center p-3 border border-gray-200 rounded-xl hover:border-blue-400 cursor-pointer bg-white hover:bg-blue-50/30 transition-all group"
                                                                            >
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="w-10 h-10 bg-gray-50 rounded-lg p-1 border border-gray-100 flex items-center justify-center group-hover:bg-white transition-colors">
                                                                                        {rate.logo ? <Image src={rate.logo} alt={rate.carrier} width={32} height={32} style={{objectFit:'contain'}}/> : <Truck size={16} className="text-gray-400"/>}
                                                                                    </div>
                                                                                    <div className="text-sm">
                                                                                        <p className="font-bold text-gray-700">{cleanCarrierName(rate.carrier)}</p>
                                                                                        <p className="text-[11px] text-gray-500 font-medium leading-tight mt-0.5 line-clamp-2">{cleanServiceName(rate.service)}</p>
                                                                                        <p className="text-[10px] text-gray-400 font-bold mt-1 flex items-center gap-1"><Clock size={10} /> {rate.days}</p>
                                                                                    </div>
                                                                                </div>
                                                                                <span className="text-sm font-bold text-blue-600">${rate.price.toFixed(2)}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )
                                                        )}
                                                        
                                                        {isPickup && !selectedRate && (
                                                            <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-xl">
                                                                <span className="flex items-center gap-2 text-green-700 font-bold text-sm"><Box size={14}/> Pickup en Tienda</span>
                                                                <span className="text-lg font-bold text-green-800">$0.00</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* DERECHA: RESUMEN DE PAGO (DESKTOP) - 🔥 CONDICIONAL AÑADIDA */}
                <div className="hidden lg:block lg:col-span-1">
                    <div ref={paymentSectionRef} className="bg-gmc-gris-oscuro text-white p-6 rounded-2xl shadow-xl sticky top-6">
                        <h3 className="font-bold text-gmc-dorado-principal text-lg mb-4 border-b border-gray-600 pb-2">{tPickup('summaryTitle')}</h3>
                        
                        {/* 🔥 ESTADO VACÍO (SIN SELECCIÓN) */}
                        {totals.count === 0 ? (
                            <div className="flex flex-col justify-center items-center h-[300px] text-center opacity-50">
                                <Truck size={48} className="mb-4 text-gray-400" />
                                <p className="text-sm text-gray-300 max-w-[200px]">Selecciona una factura o paquete a la izquierda para ver el total a pagar.</p>
                            </div>
                        ) : (
                            /* 🔥 ESTADO ACTIVO (CON SELECCIÓN) */
                            <div className="animate-fadeIn">
                                <div className="space-y-3 text-sm mb-6">
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Freight Cost</span>
                                        <span className="font-bold">${totals.serviceSubtotal.toFixed(2)}</span>
                                    </div>
                                    
                                    {totals.handlingSubtotal > 0 && (
                                        <div className="flex justify-between text-yellow-400">
                                            <span>Consolidation Fee</span>
                                            <span className="font-bold">+${totals.handlingSubtotal.toFixed(2)}</span>
                                        </div>
                                    )}

                                    {totals.insuranceSubtotal > 0 && (
                                        <div className="flex justify-between text-blue-300">
                                            <span className="flex items-center gap-1"><ShieldCheck size={14}/> + Ins (3%)</span>
                                            <span className="font-bold">+${totals.insuranceSubtotal.toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-gray-400 text-xs">
                                        <span className="flex items-center gap-1"><Info size={12}/> Processing Fee</span>
                                        <span>+${totals.fee.toFixed(2)}</span>
                                    </div>

                                    {/* DESCUENTO */}
                                    {discount > 0 && (
                                        <div className="flex justify-between text-green-400 font-bold bg-green-900/30 p-2 rounded">
                                            <span className="flex items-center gap-1"><Tag size={12} /> Discount</span>
                                            <span>-${discount.toFixed(2)}</span>
                                        </div>
                                    )}

                                    {/* INPUT DE CUPÓN */}
                                    <div className="pt-2 border-t border-gray-600">
                                        <div className="flex gap-2">
                                            <input type="text" placeholder="Promo Code" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} disabled={discount > 0} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#EAD8B1]" />
                                            {discount > 0 ? (
                                                <button onClick={() => { setDiscount(0); setCouponCode(""); setCouponMsg({ type: "", text: "" }); }} className="bg-red-500/20 text-red-400 p-2 rounded-lg hover:bg-red-500/40"><XCircle size={16} /></button>
                                            ) : (
                                                <button onClick={handleApplyCoupon} disabled={validatingCoupon || !couponCode} className="bg-[#EAD8B1] text-[#222b3c] px-3 py-2 rounded-lg text-xs font-bold hover:brightness-110 disabled:opacity-50">{validatingCoupon ? <Loader2 className="animate-spin" size={14} /> : "Apply"}</button>
                                            )}
                                        </div>
                                        {couponMsg.text && <p className={`text-[10px] mt-2 font-bold flex items-center gap-1 ${couponMsg.type === "error" ? "text-red-400" : "text-green-400"}`}>{couponMsg.type === "error" ? <AlertCircle size={10} /> : <CheckCircle size={10} />}{couponMsg.text}</p>}
                                    </div>

                                    <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-600 text-gmc-dorado-principal">
                                        <span>{tPickup('sumTotal')}</span>
                                        <span>${totals.total.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <p className="text-xs font-bold text-gray-400 mb-2 uppercase">{tPickup('paymentTitle')}</p>
                                    {cards.length > 0 ? (
                                        <div className="space-y-3">
                                            <div className="bg-gray-700 p-3 rounded flex items-center justify-between border border-gray-600">
                                                <div className="flex items-center gap-2"><CreditCard size={16}/><span className="text-xs">•••• {cards.find(c => c.id === selectedCardId)?.last4}</span></div>
                                                <Link href={`/${locale}/account-settings`} className="text-xs text-gmc-dorado-principal">{tPickup('btnChange')}</Link>
                                            </div>
                                            <button onClick={handleAddCardRedirect} className="text-xs text-[#EAD8B1] hover:underline flex items-center gap-1"><Plus size={12} /> Agregar nueva (Ir a Configuración)</button>
                                        </div>
                                    ) : (
                                        <button onClick={handleAddCardRedirect} className="w-full py-3 rounded-lg border border-gray-600 bg-gray-700/50 text-white hover:bg-gray-700 transition flex items-center justify-center gap-2 text-sm font-bold group">
                                            <div className="bg-gray-800 p-1 rounded group-hover:bg-gray-900 transition"><Plus size={16} /></div>
                                            Agregar Tarjeta en Billetera
                                        </button>
                                    )}
                                </div>

                                <button onClick={handlePay} disabled={isProcessing} className="w-full py-3 bg-gmc-dorado-principal text-gmc-gris-oscuro font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-white transition-colors disabled:opacity-50">
                                    {isProcessing ? <Loader2 className="animate-spin"/> : <DollarSign size={18}/>} {t('payNowBtn')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* --- BARRA MÓVIL PREMIUM (CONDICIONAL AÑADIDA: SOLO SI TOTAL > 0) --- */}
        {bills.length > 0 && totals.count > 0 && (
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
                <div className="absolute bottom-full left-0 right-0 h-8 bg-gradient-to-t from-gray-200/40 to-transparent pointer-events-none" />
                
                <div className="bg-[#222b3c] rounded-t-3xl shadow-[0_-5px_25px_rgba(0,0,0,0.2)] p-5 animate-slideUp text-white">
                    <div className="flex justify-between items-center gap-4">
                        <div onClick={() => setShowMobileSummary(!showMobileSummary)} className="flex flex-col cursor-pointer">
                            <span className="text-[10px] text-[#EAD8B1] font-bold uppercase tracking-widest flex items-center gap-2 mb-1">
                                {tPickup('sumTotal')} ({totals.count}) {showMobileSummary ? <ChevronDown size={14}/> : <ChevronUp size={14}/>}
                            </span>
                            <div className="text-3xl font-garamond font-bold leading-none text-white">${totals.total.toFixed(2)}</div>
                        </div>
                        
                        <button 
                            onClick={handlePay} 
                            disabled={isProcessing} 
                            className="bg-[#EAD8B1] text-[#222b3c] py-3.5 px-8 rounded-xl text-base font-bold shadow-lg active:scale-95 transition-transform flex items-center gap-2 disabled:opacity-50"
                        >
                            {isProcessing ? <Loader2 className="animate-spin" size={18}/> : <DollarSign size={18}/>} {tPickup('btnPay')}
                        </button>
                    </div>

                    {showMobileSummary && (
                        /* 🔥 CORRECCIÓN CLAVE: max-h y overflow-y-auto PARA EVITAR DISTORSIÓN DEL TECLADO */
                        <div className="mt-5 pt-5 border-t border-gray-600 space-y-3 text-sm animate-fadeIn max-h-[60vh] overflow-y-auto">
                            <div className="flex justify-between text-gray-300">
                                <span>Freight Cost</span>
                                <span>${totals.serviceSubtotal.toFixed(2)}</span>
                            </div>
                            
                            {totals.handlingSubtotal > 0 && (
                                <div className="flex justify-between text-[#EAD8B1]"><span>Consolidation Fee</span><span>+${totals.handlingSubtotal.toFixed(2)}</span></div>
                            )}

                            {totals.insuranceSubtotal > 0 && (
                                <div className="flex justify-between text-blue-300"><span>+ Insurance (3%)</span><span>+${totals.insuranceSubtotal.toFixed(2)}</span></div>
                            )}
                            
                            <div className="flex justify-between text-gray-500 text-xs"><span>Processing Fee</span><span>+${totals.fee.toFixed(2)}</span></div>

                            {/* DESCUENTO MÓVIL */}
                            {discount > 0 && (
                                <div className="flex justify-between text-green-400 font-bold">
                                    <span>Discount</span>
                                    <span>-${discount.toFixed(2)}</span>
                                </div>
                            )}

                            {/* CUPÓN MÓVIL - 🔥 CORRECCIÓN: text-base PARA EVITAR ZOOM EN IPHONE */}
                            <div className="pt-3">
                                <div className="flex gap-2">
                                    <input type="text" placeholder="Promo Code" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} disabled={discount > 0} className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-base text-white focus:outline-none focus:border-[#EAD8B1]" />
                                    <button onClick={handleApplyCoupon} className="bg-gray-600 text-white px-3 rounded-lg text-xs hover:bg-gray-500">Apply</button>
                                </div>
                                {couponMsg.text && <p className={`text-[10px] mt-1 ${couponMsg.type === "error" ? "text-red-400" : "text-green-400"}`}>{couponMsg.type === "error" ? <AlertCircle size={10} /> : <CheckCircle size={10} />}{couponMsg.text}</p>}
                            </div>

                            <div className="pt-3 border-t border-gray-600 pb-4">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Tarjeta Seleccionada</label>
                                {cards.length > 0 ? (
                                    <div className="space-y-2">
                                        <div className="relative bg-gray-700 rounded-lg border border-gray-600">
                                            <select value={selectedCardId} onChange={(e) => setSelectedCardId(e.target.value)} className="w-full p-2.5 bg-transparent text-white text-sm font-bold outline-none">
                                                {cards.map((c: any) => <option key={c.id} value={c.id} className="text-black">•••• {c.last4} ({c.brand})</option>)}
                                            </select>
                                        </div>
                                        <button onClick={handleAddCardRedirect} className="text-xs text-[#EAD8B1] font-bold flex items-center gap-1 hover:underline">
                                            <ExternalLink size={12}/> Gestionar en Configuración
                                        </button>
                                    </div>
                                ) : (
                                    <button onClick={handleAddCardRedirect} className="w-full py-2 bg-gray-700 text-white font-bold rounded-lg border border-gray-600 flex items-center justify-center gap-2">
                                        <Plus size={14}/> Ir a Agregar Tarjeta
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
}