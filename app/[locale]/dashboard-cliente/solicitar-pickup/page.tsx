"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// ❌ ArrowLeft eliminado de imports
import { Truck, MapPin, Warehouse, CreditCard, Info, Loader2, Package, Check, ChevronDown, ChevronUp, Calendar, Phone, Weight } from 'lucide-react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { getProcessingFee } from '@/lib/stripeCalc';
// 🔥 Importamos hook de traducción
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
  // 🔥 Inicializamos traducción
  const t = useTranslations('Pickup');
  const router = useRouter();
  
  // Refs
  const inventorySectionRef = useRef<HTMLDivElement>(null);
  const routeSectionRef = useRef<HTMLDivElement>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "",
    libraries: GOOGLE_LIBRARIES
  });

  // 🔥 CONSTANTES CON TRADUCCIÓN DENTRO DEL COMPONENTE
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
  const [serviceType, setServiceType] = useState<string | null>(null); 
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
      setTimeout(() => {
          if (type === 'PICKUP_WAREHOUSE') inventorySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          else routeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
  };

  // --- 3. CÁLCULOS ---
  useEffect(() => {
    if (!isLoaded && serviceType !== 'PICKUP_WAREHOUSE') return;
    const calculateTotal = () => {
        let subtotal = 0;
        let distanceSurcharge = 0;

        if (serviceType === 'PICKUP_WAREHOUSE') {
             subtotal = 0; 
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
    // Validaciones
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

        // 2. Procesar Cobro (Solo si NO es Bodega)
        if (serviceType !== 'PICKUP_WAREHOUSE') {
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

  // --- 🔥 CÁLCULO VISUAL UNIFICADO (Servicio + Fee) 🔥 ---
  // Sumamos la tarifa base + fee para mostrarlos juntos
  const serviceWithFee = quote.baseFare + quote.processingFee;

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gmc-dorado-principal"/></div>;

  // --- VISTA DE ÉXITO (CORREGIDA) ---
  if (step === 2) {
      return (
          <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center font-montserrat">
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

  // --- LÓGICA DE DISEÑO ---
  const isBodega = serviceType === 'PICKUP_WAREHOUSE';
  const gridLayoutClass = isBodega ? 'max-w-4xl mx-auto' : 'grid grid-cols-1 lg:grid-cols-3 gap-8';

  return (
    <div className="min-h-screen bg-gray-50 pb-32 md:pb-6 font-montserrat">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        
        {/* Header CENTRADO */}
        <div className="mb-6 text-center">
            <h1 className="text-xl md:text-2xl font-bold text-gmc-gris-oscuro font-garamond">{t('title')}</h1>
            <p className="text-sm text-gray-500">{t('subtitle')}</p>
        </div>

        {/* SELECTOR */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-6">
            <button onClick={() => handleServiceSelect('PICKUP_WAREHOUSE')} className={`p-4 rounded-xl border transition-all flex flex-col items-start justify-between h-full ${serviceType === 'PICKUP_WAREHOUSE' ? 'border-gmc-dorado-principal bg-yellow-50' : 'border-gray-200 bg-white'}`}>
                <Warehouse size={24} className={serviceType === 'PICKUP_WAREHOUSE' ? 'text-gmc-dorado-principal' : 'text-gray-400'}/>
                <div className="mt-2 text-left"><h3 className="font-bold text-sm text-gray-800 leading-tight">{t('tabSelfPickup')}</h3><p className="text-[10px] text-gray-500">{t('descSelfPickup')}</p></div>
            </button>
            <button onClick={() => handleServiceSelect('SHIPPING')} className={`p-4 rounded-xl border transition-all flex flex-col items-start justify-between h-full ${serviceType === 'SHIPPING' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                <Truck size={24} className={serviceType === 'SHIPPING' ? 'text-blue-600' : 'text-gray-400'}/>
                <div className="mt-2 text-left"><h3 className="font-bold text-sm text-gray-800 leading-tight">{t('tabShipping')}</h3><p className="text-[10px] text-gray-500">{t('descShipping')}</p></div>
            </button>
            <button onClick={() => handleServiceSelect('DELIVERY')} className={`p-4 rounded-xl border transition-all flex flex-col items-start justify-between h-full col-span-2 md:col-span-1 ${serviceType === 'DELIVERY' ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white'}`}>
                <MapPin size={24} className={serviceType === 'DELIVERY' ? 'text-green-600' : 'text-gray-400'}/>
                <div className="mt-2 text-left"><h3 className="font-bold text-sm text-gray-800 leading-tight">{t('tabDelivery')}</h3><p className="text-[10px] text-gray-500">{t('descDelivery')}</p></div>
            </button>
        </div>

        {/* INFO BODEGA */}
        {(serviceType === 'PICKUP_WAREHOUSE') && (
            <div ref={inventorySectionRef} className="scroll-mt-4 bg-orange-50 border border-orange-200 p-4 rounded-xl mb-6 flex gap-3 text-sm animate-fadeIn">
                <Info size={20} className="text-orange-600 shrink-0 mt-0.5"/>
                <div>
                    <h3 className="font-bold text-orange-900 uppercase text-xs mb-1">{t('storageRatesTitle')}</h3>
                    <p className="text-orange-800 leading-relaxed">
                        {t('storageRatesText')}
                    </p>
                </div>
            </div>
        )}

        {serviceType && (
            <div className={gridLayoutClass + " animate-fadeIn"}>
                <div className={isBodega ? "w-full" : "lg:col-span-2 space-y-6"}>
                    
                    {/* CASO A: INVENTARIO BODEGA - SOLO INFO, SIN BOTÓN */}
                    {serviceType === 'PICKUP_WAREHOUSE' ? (
                        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                                <h3 className="font-bold text-gmc-gris-oscuro text-sm uppercase">{t('inventoryTitle')}</h3>
                                <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded font-bold">{t('statusReady')}</div>
                            </div>
                            
                            {inventoryLoading ? <div className="text-center py-4"><Loader2 className="animate-spin mx-auto"/></div> : inventory.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded text-gray-500">
                                    <Package className="mx-auto mb-2 text-gray-300" size={32}/>
                                    <p className="font-bold text-sm">No tienes paquetes disponibles para recoger.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {inventory.map((pkg, idx) => {
                                        const paidAmount = pkg.consolidatedShipment?.totalAmount || 0;
                                        return (
                                            <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm shadow-sm hover:border-blue-300 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                                                        <Package size={20} className="text-blue-500"/>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-800 truncate max-w-[150px]">{pkg.description || 'Paquete'}</span>
                                                        <span className="text-[10px] text-gray-500 font-mono">{pkg.gmcTrackingNumber}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                     <div className="text-xs font-bold text-gray-500 mb-1">{t('paid')}: ${paidAmount.toFixed(2)}</div>
                                                     <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200 uppercase tracking-wide">LISTO</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            
                            <div className="mt-6 bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-xs text-yellow-800">
                                <p className="font-bold mb-2 flex items-center gap-2"><Info size={14}/> {t('handlingRatesTitle')}</p>
                                <ul className="space-y-1 pl-1">
                                    <li>• 0-50 lbs: <strong>$5.00</strong></li>
                                    <li>• 51-150 lbs: <strong>$15.00</strong></li>
                                    <li>• +150 lbs: <strong>$35.00</strong></li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        /* CASO B: FORMULARIOS DE RUTA (SHIPPING / DELIVERY) */
                        <>
                            <div ref={routeSectionRef} className="scroll-mt-4 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                                <h3 className="font-bold text-gmc-gris-oscuro text-sm uppercase mb-2">{t('routeTitle')}</h3>
                                <div>
                                    <label className="text-xs font-bold text-gray-400">{t('pickupPointA')}</label>
                                    <Autocomplete onLoad={ref => { originRef.current = ref }} onPlaceChanged={() => { const place = originRef.current?.getPlace(); if(place?.formatted_address) { setFormData(prev => ({...prev, originAddress: place.formatted_address!})); if(serviceType === 'SHIPPING') calculateDistance(place.formatted_address!, GMC_WAREHOUSE_ADDRESS); } }}><input type="text" placeholder="Dirección de recogida..." className="w-full p-3 border rounded-lg text-sm" /></Autocomplete>
                                </div>
                                {serviceType === 'SHIPPING' && (
                                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-full text-blue-600 shadow-sm"><Warehouse size={18}/></div>
                                        <div>
                                            <p className="text-xs font-bold text-blue-800 uppercase">{t('interDestTitle')}</p>
                                            <p className="text-sm font-bold text-gray-700">{t('gmcWarehouse')}</p>
                                            <p className="text-[10px] text-gray-500">{t('exportNote')}</p>
                                        </div>
                                    </div>
                                )}
                                {serviceType === 'DELIVERY' && (
                                    <div>
                                        <label className="text-xs font-bold text-gray-400">{t('dropoffPointB')}</label>
                                        <Autocomplete onLoad={ref => { destRef.current = ref }} onPlaceChanged={() => { const place = destRef.current?.getPlace(); if(place?.formatted_address) { setFormData(prev => ({...prev, dropOffAddress: place.formatted_address!})); calculateDistance(formData.originAddress, place.formatted_address!); } }}><input type="text" placeholder="Dirección de entrega..." className="w-full p-3 border rounded-lg text-sm" /></Autocomplete>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="font-bold text-gmc-gris-oscuro text-sm uppercase mb-4">{t('loadDetailsTitle')}</h3>
                                
                                {/* 🔥 DISEÑO MÓVIL ARREGLADO (1 COLUMNA EN MÓVIL, 2 EN PC) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="relative">
                                        <select 
                                            className="w-full p-3 pl-4 border border-gray-200 rounded-xl text-sm bg-white appearance-none font-medium focus:ring-2 focus:ring-gmc-dorado-principal focus:border-transparent" 
                                            onChange={e => setFormData({...formData, weightTier: e.target.value})}
                                            value={formData.weightTier}
                                        >
                                            {WEIGHT_TIERS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                    </div>

                                    <div className="relative">
                                        <select 
                                            className="w-full p-3 pl-4 border border-gray-200 rounded-xl text-sm bg-white appearance-none font-medium focus:ring-2 focus:ring-gmc-dorado-principal focus:border-transparent" 
                                            onChange={e => setFormData({...formData, volumeTier: e.target.value})}
                                            value={formData.volumeTier}
                                        >
                                            {VOLUME_TIERS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                    </div>
                                </div>

                                {/* 🔥 CAMPO HEAVY CON ANIMACIÓN SUAVE */}
                                {formData.weightTier === 'w_heavy' && (
                                    <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="relative">
                                            <Weight className="absolute left-3 top-1/2 -translate-y-1/2 text-gmc-dorado-principal" size={18} />
                                            <input 
                                                type="number" 
                                                placeholder="Peso exacto (Lbs)" 
                                                className="w-full p-3 pl-10 border border-yellow-200 rounded-xl bg-yellow-50 text-sm font-bold placeholder-yellow-600/50 focus:ring-2 focus:ring-yellow-400 focus:outline-none" 
                                                onChange={e => setFormData({...formData, exactWeight: parseFloat(e.target.value)})} 
                                            />
                                        </div>
                                        <p className="text-[10px] text-yellow-600 mt-1 pl-2 font-medium">Tarifa especial para carga pesada.</p>
                                    </div>
                                )}

                                {/* 🔥 FECHA Y TELÉFONO (ARREGLADO EL BOTÓN FANTASMA) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    {/* Input de Fecha Mejorado */}
                                    <div className="relative">
                                        <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-gray-400 z-10">Fecha de Recogida</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input 
                                                type="date" 
                                                className="w-full p-3 pl-10 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gmc-dorado-principal focus:border-transparent min-h-[46px]" 
                                                onChange={e => setFormData({...formData, pickupDate: e.target.value})} 
                                            />
                                        </div>
                                    </div>

                                    {/* Input de Teléfono Mejorado */}
                                    <div className="relative">
                                         <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-gray-400 z-10">Contacto</label>
                                         <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input 
                                                type="tel" 
                                                placeholder="Teléfono" 
                                                className="w-full p-3 pl-10 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gmc-dorado-principal focus:border-transparent min-h-[46px]" 
                                                onChange={e => setFormData({...formData, contactPhone: e.target.value})} 
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <textarea className="w-full p-3 border border-gray-200 rounded-xl text-sm h-24 resize-none focus:ring-2 focus:ring-gmc-dorado-principal focus:border-transparent" placeholder="Descripción de los artículos (Ej: 2 cajas de ropa, 1 TV 55 pulgadas...)" onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                            </div>
                        </>
                    )}
                </div>

                {/* 🔥 SIDEBAR DESKTOP - OCULTA SI ES BODEGA 🔥 */}
                {!isBodega && (
                    <div className="hidden lg:block lg:col-span-1">
                        <div className="bg-gmc-gris-oscuro text-white p-6 rounded-2xl shadow-xl sticky top-6">
                            <h3 className="font-bold text-gmc-dorado-principal text-lg mb-4 border-b border-gray-600 pb-2">{t('summaryTitle')}</h3>
                            <div className="space-y-3 text-sm mb-4">
                                
                                {/* 🔥 SERVICIO + FEE COMBINADOS 🔥 */}
                                <div className="flex justify-between">
                                    <span>{t('sumService')}</span>
                                    <span className="font-mono font-bold">${serviceWithFee.toFixed(2)}</span>
                                </div>
                                
                                <div className="flex justify-between">
                                    <span>{t('sumDistance')}</span>
                                    <span>+${quote.distanceSurcharge.toFixed(2)}</span>
                                </div>
                                
                                {/* ❌ FEE ELIMINADO VISUALMENTE (Ya sumado en 'serviceWithFee') */}
                                
                                <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-600 text-gmc-dorado-principal">
                                    <span>{t('sumTotal')}</span>
                                    <span>${quote.total.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="mb-4">
                                <p className="text-xs font-bold text-gray-400 mb-2 uppercase">{t('paymentTitle')}</p>
                                {cards.length > 0 ? (
                                    <div className="bg-gray-700 p-3 rounded flex items-center justify-between border border-gray-600">
                                        <div className="flex items-center gap-2"><CreditCard size={16}/><span className="text-xs">•••• {cards.find(c => c.id === selectedCardId)?.last4}</span></div>
                                        <Link href="/account-settings" className="text-xs text-gmc-dorado-principal">{t('btnChange')}</Link>
                                    </div>
                                ) : <Link href="/account-settings" className="block text-center text-xs p-2 bg-gray-700 rounded text-white">+ Agregar Tarjeta</Link>}
                            </div>
                            <button onClick={handlePaymentAndSubmit} disabled={isLoading || quote.total === 0} className="w-full py-3 bg-gmc-dorado-principal text-gmc-gris-oscuro font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-white transition-colors disabled:opacity-50">
                                {isLoading ? <Loader2 className="animate-spin"/> : <CreditCard size={18}/>} {t('btnPay')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* BARRA MÓVIL STICKY - SOLO VISIBLE SI NO ES BODEGA */}
        {serviceType && !isBodega && (
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 flex items-center justify-between gap-4">
                <div onClick={() => setShowMobileSummary(!showMobileSummary)} className="flex-1 cursor-pointer">
                    <p className="text-[10px] text-gray-500 flex items-center gap-1 font-bold uppercase tracking-wide">{t('sumTotal')} {showMobileSummary ? <ChevronDown size={12}/> : <ChevronUp size={12}/>}</p>
                    <p className="text-xl font-bold text-gmc-gris-oscuro">${quote.total.toFixed(2)}</p>
                </div>
                
                <button onClick={handlePaymentAndSubmit} disabled={isLoading || quote.total === 0 || !selectedCardId} className="bg-gmc-gris-oscuro text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg disabled:opacity-50">
                    {isLoading ? <Loader2 className="animate-spin" size={18}/> : <CreditCard size={18}/>} {t('btnPay')}
                </button>

                {showMobileSummary && (
                    <div className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-lg animate-fadeIn text-sm text-gray-700 space-y-2 pb-6">
                        {/* 🔥 MÓVIL TAMBIÉN COMBINADO 🔥 */}
                        <div className="flex justify-between"><span>Base</span><span>${serviceWithFee.toFixed(2)}</span></div>
                        
                        <div className="h-px bg-gray-100 my-2"></div>
                        <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                            <span className="text-xs flex items-center gap-2 font-bold"><CreditCard size={14}/> Tarjeta</span>
                            {cards.length > 0 ? <span className="font-mono text-xs">•••• {cards.find(c => c.id === selectedCardId)?.last4}</span> : <Link href="/account-settings" className="text-xs text-blue-600 underline">Agregar</Link>}
                        </div>
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
}