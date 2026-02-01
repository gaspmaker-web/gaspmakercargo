"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    Truck, MapPin, Warehouse, CreditCard, Info, Loader2, Package, Check, 
    ChevronDown, ChevronUp, Calendar, Phone, Weight, ArrowLeft, Building2 
} from 'lucide-react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { getProcessingFee } from '@/lib/stripeCalc';
import { useTranslations } from 'next-intl';

// --- CONFIGURACIÓN ---
const FEE_STANDARD = 5.00;   
const FEE_HEAVY = 15.00;     
const FEE_PALLET = 35.00;    

const BASE_MILES = 10;
const MILE_SURCHARGE = 1.50;
const HEAVY_RATE_PER_LB = 0.55;
const GMC_WAREHOUSE_ADDRESS = "1861 NW 22nd St, Miami, FL 33142";

const GOOGLE_LIBRARIES: ("places")[] = ["places"];

export default function SolicitarPickupPage() {
  const t = useTranslations('Pickup');
  const router = useRouter();
  
  const inventorySectionRef = useRef<HTMLDivElement>(null);
  const routeSectionRef = useRef<HTMLDivElement>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "",
    libraries: GOOGLE_LIBRARIES
  });

  const WEIGHT_TIERS = [
    { id: 'w_30', label: t('sizeSmall'), price: 30 },
    { id: 'w_45', label: t('sizeMedium'), price: 45 },
    { id: 'w_65', label: t('sizeLarge'), price: 65 },
    { id: 'w_85', label: t('sizeXLarge'), price: 85 },
    { id: 'w_heavy', label: t('sizeHeavy'), price: 0 }, 
  ];

  const VOLUME_TIERS = [
    { id: 'v_30', label: t('volLow'), price: 30 },
    { id: 'v_55', label: t('volMed'), price: 55 },
    { id: 'v_75', label: t('volHigh'), price: 75 },
    { id: 'v_100', label: t('volFull'), price: 100 },
  ];

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [serviceType, setServiceType] = useState<string | null>('PICKUP_WAREHOUSE'); // Default selection
  const [inventory, setInventory] = useState<any[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [cards, setCards] = useState<any[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [showMobileSummary, setShowMobileSummary] = useState(false);

  const [quote, setQuote] = useState({ 
      total: 0, subtotal: 0, processingFee: 0, baseFare: 0, distanceSurcharge: 0, distanceMiles: 0, appliedStrategy: 'WEIGHT' 
  });
  
  const [orderId, setOrderId] = useState<string | null>(null);
  
  const originRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destRef = useRef<google.maps.places.Autocomplete | null>(null);

  const [formData, setFormData] = useState({
    originAddress: '', originCity: '', pickupDate: '', description: '', contactPhone: '',
    dropOffAddress: '', dropOffCity: '', dropOffContact: '', dropOffPhone: '',
    weightTier: 'w_30', volumeTier: 'v_30', exactWeight: 0, termsAccepted: false
  });

  // --- 1. CARGAR DATOS ---
  useEffect(() => {
      const fetchData = async () => {
          try {
              const cardsRes = await fetch('/api/user/cards');
              if (cardsRes.ok) {
                  const data = await cardsRes.json();
                  setCards(data.cards);
                  if(data.cards.length > 0) setSelectedCardId(data.cards[0].id);
              }

              const invRes = await fetch('/api/packages/inventory');
              if (invRes.ok) {
                  const invData = await invRes.json();
                  setInventory(invData.packages || []);
              }
          } catch (error) { console.error(error); } 
          finally { setInventoryLoading(false); }
      };
      fetchData();
  }, []);

  // --- 2. MANEJO DE SELECCIÓN ---
  const handleServiceSelect = (type: string) => {
      setServiceType(type);
      // Animación suave de scroll
      setTimeout(() => {
          window.scrollTo({ top: 300, behavior: 'smooth' });
      }, 100);
  };

  // --- 3. CÁLCULOS ---
  useEffect(() => {
    if (!isLoaded && serviceType !== 'PICKUP_WAREHOUSE') return;
    const calculateTotal = () => {
        let subtotal = 0;
        let distanceSurcharge = 0;

        if (serviceType === 'PICKUP_WAREHOUSE') {
             subtotal = 0; // Se paga al retirar o ya está pagado
        } else {
            let tp = 0;
            if (formData.weightTier === 'w_heavy') {
                const weight = formData.exactWeight > 150 ? formData.exactWeight : 151;
                tp = weight * HEAVY_RATE_PER_LB;
            } else {
                tp = WEIGHT_TIERS.find(t => t.id === formData.weightTier)?.price || 0;
            }
            const tv = VOLUME_TIERS.find(v => v.id === formData.volumeTier)?.price || 0;
            const baseFare = Math.max(tp, tv);
            if (quote.distanceMiles > BASE_MILES) distanceSurcharge = (quote.distanceMiles - BASE_MILES) * MILE_SURCHARGE;
            subtotal = baseFare + distanceSurcharge;
        }
        
        const fee = subtotal > 0 ? getProcessingFee(subtotal) : 0;
        
        setQuote(prev => ({ 
            ...prev, 
            baseFare: subtotal - distanceSurcharge, 
            distanceSurcharge, 
            subtotal, 
            processingFee: fee, 
            total: subtotal + fee 
        }));
    };
    calculateTotal();
  }, [formData.weightTier, formData.volumeTier, formData.exactWeight, quote.distanceMiles, isLoaded, serviceType, inventory]);

  const calculateDistance = async (origin: string, destination: string) => {
    if (!isLoaded || typeof google === 'undefined' || !origin || !destination) return;
    try {
        const service = new google.maps.DistanceMatrixService();
        const result = await service.getDistanceMatrix({
            origins: [origin], destinations: [destination],
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.IMPERIAL
        });
        const element = result.rows[0].elements[0];
        if (element.status === "OK") {
            const miles = element.distance.value / 1609.34;
            setQuote(prev => ({ ...prev, distanceMiles: parseFloat(miles.toFixed(1)) }));
        }
    } catch (e) { console.error(e); }
  };

  const handlePaymentAndSubmit = async () => {
    if (serviceType !== 'PICKUP_WAREHOUSE') {
        if (!formData.originAddress || !formData.pickupDate) { alert("Completa los campos."); return; }
        if (!selectedCardId) { alert("Selecciona un método de pago."); return; }
    }

    setIsLoading(true);
    try {
        let paymentData = {
            subtotal: quote.subtotal,
            fee: quote.processingFee,
            total: quote.total,
            paymentId: 'PREPAID_PICKUP'
        };

        if (serviceType !== 'PICKUP_WAREHOUSE' && quote.total > 0) {
            const payRes = await fetch('/api/payments/charge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amountNet: quote.total, 
                    paymentMethodId: selectedCardId,
                    serviceType,
                    description: `${serviceType}`
                })
            });
            
            try {
                const payData = await payRes.json();
                if (payRes.ok && payData && payData.financials) {
                    paymentData = {
                        subtotal: payData.financials.subtotal,
                        fee: payData.financials.fee,
                        total: payData.financials.total,
                        paymentId: payData.paymentId
                    };
                } else if (!payRes.ok) {
                    throw new Error(payData.message || "Error al procesar el pago.");
                }
            } catch (err) {
                console.warn("Usando fallback local de precios.");
            }
        }

        const payload = {
            ...formData,
            serviceType,
            status: 'PAGADO', 
            originAddress: serviceType === 'PICKUP_WAREHOUSE' ? GMC_WAREHOUSE_ADDRESS : formData.originAddress,
            dropOffAddress: serviceType === 'DELIVERY' ? formData.dropOffAddress : GMC_WAREHOUSE_ADDRESS,
            subtotal: paymentData.subtotal,
            processingFee: paymentData.fee,
            totalPaid: paymentData.total,
            stripePaymentId: paymentData.paymentId,
            description: serviceType === 'PICKUP_WAREHOUSE' ? 'Retiro Personal en Bodega' : formData.description,
            weightInfo: formData.weightTier,
        };

        const orderRes = await fetch('/api/pickup', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        if (orderRes.ok) { setOrderId('CONFIRMED'); setStep(2); } 
        else { alert("Error guardando la solicitud."); }

    } catch (error: any) { alert(error.message || "Error inesperado."); } 
    finally { setIsLoading(false); }
  };

  const serviceWithFee = quote.baseFare + quote.processingFee;

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gmc-dorado-principal"/></div>;

  if (step === 2) {
      return (
          <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center font-montserrat w-full overflow-x-hidden">
              <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><Check size={32} className="text-green-600"/></div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('successTitle')}</h2>
                  <p className="text-gray-600 mb-6">
                      {serviceType === 'PICKUP_WAREHOUSE' ? t('successMsgPickup') : t('successMsgShipping')}
                  </p>
                  <Link href="/dashboard-cliente" className="px-6 py-3 rounded-xl bg-gmc-gris-oscuro text-white font-bold">{t('btnBack')}</Link>
              </div>
          </div>
      );
  }

  const isBodega = serviceType === 'PICKUP_WAREHOUSE';

  return (
    <div className="min-h-screen bg-gray-50 pb-40 font-montserrat relative">
        
        {/* --- HEADER --- */}
        <div className="bg-white sticky top-0 z-20 px-4 py-4 border-b border-gray-100 shadow-sm">
            <div className="max-w-xl mx-auto flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition">
                    <ArrowLeft size={24} className="text-gray-700"/>
                </button>
                <div>
                    <h1 className="text-lg font-bold text-gmc-gris-oscuro font-garamond">{t('title')}</h1>
                    <p className="text-xs text-gray-400">{t('subtitle')}</p>
                </div>
            </div>
        </div>

        <div className="max-w-xl mx-auto p-4 space-y-6">

            {/* --- SELECCIÓN DE SERVICIO (Diseño de Tarjetas IMG_3060) --- */}
            <div className="grid grid-cols-2 gap-4">
                {/* Warehouse / Self Pickup */}
                <div 
                    onClick={() => handleServiceSelect('PICKUP_WAREHOUSE')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between h-28 ${serviceType === 'PICKUP_WAREHOUSE' ? 'bg-white border-gray-800 shadow-md ring-1 ring-gray-200' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                >
                    <Warehouse size={24} className={serviceType === 'PICKUP_WAREHOUSE' ? 'text-gray-800' : 'text-gray-300'}/>
                    <div>
                        <p className={`font-bold text-sm leading-tight ${serviceType === 'PICKUP_WAREHOUSE' ? 'text-gray-800' : 'text-gray-400'}`}>{t('tabSelfPickup')}</p>
                        <p className="text-[10px] mt-1">{t('descSelfPickup')}</p>
                    </div>
                </div>

                {/* Intl. Shipping */}
                <div 
                    onClick={() => handleServiceSelect('SHIPPING')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between h-28 ${serviceType === 'SHIPPING' ? 'bg-blue-50 border-blue-500 shadow-md ring-1 ring-blue-100' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                >
                    <Truck size={24} className={serviceType === 'SHIPPING' ? 'text-blue-600' : 'text-gray-300'}/>
                    <div>
                        <p className={`font-bold text-sm leading-tight ${serviceType === 'SHIPPING' ? 'text-blue-700' : 'text-gray-400'}`}>{t('tabShipping')}</p>
                        <p className="text-[10px] mt-1">{t('descShipping')}</p>
                    </div>
                </div>
            </div>

            {/* Local Delivery (Card Verde Completa IMG_3061) */}
            <div 
                onClick={() => handleServiceSelect('DELIVERY')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${serviceType === 'DELIVERY' ? 'bg-green-50 border-green-500 shadow-md ring-1 ring-green-100' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
            >
                <div className={`p-2 rounded-full border shadow-sm ${serviceType === 'DELIVERY' ? 'bg-white border-green-200 text-green-600' : 'bg-gray-50 border-gray-100 text-gray-300'}`}>
                    <MapPin size={20}/>
                </div>
                <div>
                    <h3 className={`font-bold text-sm ${serviceType === 'DELIVERY' ? 'text-green-800' : 'text-gray-400'}`}>{t('tabDelivery')}</h3>
                    <p className={`text-xs ${serviceType === 'DELIVERY' ? 'text-green-600' : 'text-gray-300'}`}>{t('descDelivery')}</p>
                </div>
            </div>

            {/* --- CONTENIDO DINÁMICO SEGÚN SELECCIÓN --- */}
            
            {/* CASO: BODEDA (INVENTARIO) */}
            {serviceType === 'PICKUP_WAREHOUSE' && (
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm animate-fadeIn">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('inventoryTitle')}</h3>
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">{t('statusReady')}</span>
                    </div>
                    
                    {inventoryLoading ? <div className="text-center py-4"><Loader2 className="animate-spin mx-auto"/></div> : inventory.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-xl text-gray-400 border border-dashed border-gray-200">
                            <Package className="mx-auto mb-2 opacity-20" size={32}/>
                            <p className="font-bold text-sm">Sin paquetes listos.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {inventory.map((pkg, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm"><Package size={18} className="text-blue-500"/></div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-xs">{pkg.description || 'Paquete'}</p>
                                            <p className="text-[10px] text-gray-400 font-mono">{pkg.gmcTrackingNumber}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-gray-600">${pkg.consolidatedShipment?.totalAmount?.toFixed(2) || '0.00'}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100 flex gap-3">
                            <Info size={16} className="text-yellow-600 mt-0.5 shrink-0"/>
                            <div className="text-xs text-yellow-800">
                                <p className="font-bold mb-1">{t('handlingRatesTitle')}</p>
                                <p>0-50lbs: $5 • 51-150lbs: $15 • +150lbs: $35</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CASO: DELIVERY O SHIPPING (RUTAS + CARGA) */}
            {serviceType !== 'PICKUP_WAREHOUSE' && (
                <>
                    {/* ROUTE SECTION */}
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-5 animate-fadeIn">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('routeTitle')}</h3>
                        
                        {/* Pickup Input */}
                        <div className="relative">
                            <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase">Pickup (A)</label>
                            <Autocomplete onLoad={ref => { originRef.current = ref }} onPlaceChanged={() => { const place = originRef.current?.getPlace(); if(place?.formatted_address) { setFormData(prev => ({...prev, originAddress: place.formatted_address!})); if(serviceType === 'SHIPPING') calculateDistance(place.formatted_address!, GMC_WAREHOUSE_ADDRESS); } }}>
                                <input type="text" placeholder="Dirección de recogida..." className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-gmc-dorado-principal focus:bg-white transition-colors" />
                            </Autocomplete>
                        </div>

                        {/* Intermediate Destination (Card Azul GMC) */}
                        {serviceType === 'SHIPPING' && (
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-4">
                                <div className="bg-white p-2 rounded-lg text-blue-600 shadow-sm"><Building2 size={20}/></div>
                                <div>
                                    <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">{t('interDestTitle')}</p>
                                    <p className="font-bold text-gray-800 text-sm">{t('gmcWarehouse')}</p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{t('exportNote')}</p>
                                </div>
                            </div>
                        )}

                        {/* Dropoff Input (Solo Local Delivery) */}
                        {serviceType === 'DELIVERY' && (
                            <div className="relative">
                                <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase">{t('dropoffPointB')}</label>
                                <Autocomplete onLoad={ref => { destRef.current = ref }} onPlaceChanged={() => { const place = destRef.current?.getPlace(); if(place?.formatted_address) { setFormData(prev => ({...prev, dropOffAddress: place.formatted_address!})); calculateDistance(formData.originAddress, place.formatted_address!); } }}>
                                    <input type="text" placeholder="Dirección de entrega..." className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-gmc-dorado-principal focus:bg-white transition-colors" />
                                </Autocomplete>
                            </div>
                        )}
                    </div>

                    {/* LOAD DETAILS */}
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 animate-fadeIn">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('loadDetailsTitle')}</h3>
                        
                        <div className="relative">
                            <select 
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 appearance-none focus:outline-none focus:border-gmc-dorado-principal"
                                onChange={e => setFormData({...formData, weightTier: e.target.value})}
                                value={formData.weightTier}
                            >
                                {WEIGHT_TIERS.map(t => <option key={t.id} value={t.id}>{t.label} - ${t.price}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18}/>
                        </div>

                        {formData.weightTier === 'w_heavy' && (
                            <div className="relative animate-fadeIn">
                                <Weight className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-600" size={18} />
                                <input 
                                    type="number" 
                                    placeholder="Peso exacto (Lbs)" 
                                    className="w-full p-4 pl-12 border border-yellow-200 rounded-xl bg-yellow-50 text-sm font-bold placeholder-yellow-600/50 focus:outline-none" 
                                    onChange={e => setFormData({...formData, exactWeight: parseFloat(e.target.value)})} 
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                                <input 
                                    type="date" 
                                    className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none"
                                    onChange={e => setFormData({...formData, pickupDate: e.target.value})}
                                />
                            </div>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                                <input 
                                    type="tel" 
                                    placeholder="Teléfono"
                                    className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none"
                                    onChange={e => setFormData({...formData, contactPhone: e.target.value})}
                                />
                            </div>
                        </div>
                        
                        <textarea 
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm h-24 resize-none focus:outline-none focus:border-gmc-dorado-principal placeholder-gray-400" 
                            placeholder="Descripción de los artículos..." 
                            onChange={e => setFormData({...formData, description: e.target.value})}
                        ></textarea>
                    </div>
                </>
            )}

        </div>

        {/* --- STICKY FOOTER (Barra Móvil Oscura - Diseño IMG_3061) --- */}
        {!isBodega && (
            <div className="fixed bottom-0 left-0 right-0 z-50">
                {/* Degradado superior */}
                <div className="absolute bottom-full left-0 right-0 h-8 bg-gradient-to-t from-gray-200/40 to-transparent pointer-events-none" />
                
                <div className="bg-white border-t border-gray-100 p-4 pb-8 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                    <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
                        
                        {/* Total (Izquierda) */}
                        <div onClick={() => setShowMobileSummary(!showMobileSummary)} className="flex flex-col cursor-pointer">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                                Total <ChevronUp size={12} className={`transition-transform ${showMobileSummary ? 'rotate-180' : ''}`}/>
                            </div>
                            <div className="text-3xl font-black text-gray-900 leading-none">${quote.total.toFixed(2)}</div>
                        </div>

                        {/* Botón Pay (Derecha - Oscuro) */}
                        <button 
                            onClick={handlePaymentAndSubmit} 
                            disabled={isLoading || quote.total === 0 || !selectedCardId} 
                            className="bg-[#222b3c] text-white px-8 py-3.5 rounded-xl font-bold text-base shadow-xl active:scale-95 transition-transform flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20}/> : <CreditCard size={20}/>} 
                            {t('btnPay')}
                        </button>
                    </div>

                    {/* Desplegable de Detalles */}
                    {showMobileSummary && (
                        <div className="mt-4 pt-4 border-t border-dashed border-gray-200 animate-slideUp text-sm space-y-2 max-w-xl mx-auto">
                            <div className="flex justify-between text-gray-600">
                                <span>Service Base</span>
                                <span>${quote.baseFare.toFixed(2)}</span>
                            </div>
                            {quote.distanceSurcharge > 0 && (
                                <div className="flex justify-between text-blue-600"><span>Distance Surcharge</span><span>+${quote.distanceSurcharge.toFixed(2)}</span></div>
                            )}
                            <div className="flex justify-between text-gray-400 text-xs">
                                <span>Processing Fee</span>
                                <span>+${quote.processingFee.toFixed(2)}</span>
                            </div>
                            
                            <div className="pt-3 mt-2 border-t border-gray-100">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">PAYING WITH</label>
                                {cards.length > 0 ? (
                                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <CreditCard size={14} className="text-gray-800"/>
                                            <span className="font-mono text-xs font-bold text-gray-700">•••• {cards.find(c => c.id === selectedCardId)?.last4}</span>
                                        </div>
                                        <Link href="/account-settings" className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Change</Link>
                                    </div>
                                ) : <Link href="/account-settings" className="text-xs text-blue-600 underline font-bold">+ Add Card</Link>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
}