"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    Truck, MapPin, Warehouse, CreditCard, Info, Loader2, Package, Check, 
    ChevronDown, ChevronUp, Calendar, Phone, Weight, AlertTriangle, Clock
} from 'lucide-react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { getProcessingFee } from '@/lib/stripeCalc';
import { useTranslations } from 'next-intl';

// --- CONFIGURACIÓN DE TARIFAS (HANDLING RATES) ---
const FEE_MINI = 2.50;       // 0-10 lbs (Compite con iPostal1)
const FEE_STANDARD = 5.00;   // 11-50 lbs
const FEE_HEAVY = 12.50;     // 51-150 lbs
const FEE_PALLET = 30.00;    // +150 lbs (Carga comercial)

const BASE_MILES = 10;
const GMC_WAREHOUSE_ADDRESS = "1861 NW 22nd St, Miami, FL 33142";

// 🔥 TARIFAS DE DELIVERY / SHIPPING
const MILE_RATE_STD = 1.50;      // Milla Estándar
const MILE_RATE_TRUCK = 2.50;    // Milla Camión
const HEAVY_RATE_STD = 0.55;     // Peso <= 1999 lbs
const HEAVY_RATE_BULK = 0.35;    // Peso > 1999 lbs
const FULL_FREIGHT_BASE = 250;   // Base Camión

// 🔥 ZONAS PERMITIDAS (Aplica para Pickup y Dropoff)
const ALLOWED_COUNTIES = ['Miami-Dade County', 'Broward County'];

const GOOGLE_LIBRARIES: ("places")[] = ["places"];

export default function SolicitarPickupPage() {
  const t = useTranslations('Pickup');
  const tBills = useTranslations('PendingBills'); 
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
    { id: 'v_250', label: t('volFull'), price: 250 }, 
  ];

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [serviceType, setServiceType] = useState<string | null>('PICKUP_WAREHOUSE'); 
  const [inventory, setInventory] = useState<any[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [cards, setCards] = useState<any[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [showMobileSummary, setShowMobileSummary] = useState(false);

  const [addressError, setAddressError] = useState<string | null>(null);
  const [dropOffError, setDropOffError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [isAddressValid, setIsAddressValid] = useState(false);
  const [isTimeValid, setIsTimeValid] = useState(false); 

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
      setAddressError(null);
      setDropOffError(null);
      setTimeError(null);
      setQuote(prev => ({ ...prev, distanceMiles: 0, distanceSurcharge: 0 }));
      setTimeout(() => {
          window.scrollTo({ top: 150, behavior: 'smooth' });
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
                const weight = formData.exactWeight > 0 ? formData.exactWeight : 0;
                const rate = weight > 1999 ? HEAVY_RATE_BULK : HEAVY_RATE_STD;
                tp = weight * rate;
            } else {
                tp = WEIGHT_TIERS.find(t => t.id === formData.weightTier)?.price || 0;
            }

            let baseFare = 0;
            let mileRate = MILE_RATE_STD;

            if (formData.volumeTier === 'v_250') {
                mileRate = MILE_RATE_TRUCK;
                if (formData.weightTier === 'w_heavy') {
                    baseFare = FULL_FREIGHT_BASE + tp;
                } else {
                    baseFare = FULL_FREIGHT_BASE;
                }
            } else {
                const tv = VOLUME_TIERS.find(v => v.id === formData.volumeTier)?.price || 0;
                baseFare = Math.max(tp, tv);
                mileRate = MILE_RATE_STD;
            }

            if (quote.distanceMiles > BASE_MILES) {
                distanceSurcharge = (quote.distanceMiles - BASE_MILES) * mileRate;
            }
            
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

  // ✅ LÓGICA ENTERPRISE: Basada en la Tarjeta
  const activeCardDetails = cards.find(c => c.id === selectedCardId);
  const isTrinidadCard = activeCardDetails?.country?.toUpperCase() === 'TT';
  const tasaTTD = 7.30;
  const montoTTD = (quote.total * tasaTTD).toFixed(2);

  // --- MAPS & VALIDACIÓN ---
  const handleOriginChange = () => {
      if (!originRef.current) return;
      const place = originRef.current.getPlace();

      if (!place || !place.geometry || !place.formatted_address) {
          setAddressError("⚠️ Dirección inválida. Selecciona de la lista.");
          setIsAddressValid(false);
          setFormData(prev => ({ ...prev, originAddress: '' }));
          return;
      }

      let county = '';
      if (place.address_components) {
          const countyComp = place.address_components.find(c => c.types.includes('administrative_area_level_2'));
          if (countyComp) county = countyComp.long_name;
      }
      const isAllowed = ALLOWED_COUNTIES.some(allowed => county === allowed);
      if (!isAllowed) {
          setAddressError(`❌ Solo atendemos en Miami-Dade y Broward. (Zona: ${county || 'Desconocida'})`);
          setIsAddressValid(false);
          setFormData(prev => ({ ...prev, originAddress: '' }));
          return;
      }

      setAddressError(null);
      setIsAddressValid(true);
      const newOrigin = place.formatted_address!;
      setFormData(prev => ({ ...prev, originAddress: newOrigin }));
      
      calculateComplexRoute(newOrigin, formData.dropOffAddress);
  };

  const handleDropoffChange = () => {
      if (!destRef.current) return;
      const place = destRef.current.getPlace();

      if (!place || !place.geometry || !place.formatted_address) {
          setFormData(prev => ({ ...prev, dropOffAddress: '' }));
          return;
      }

      let county = '';
      if (place.address_components) {
          const countyComp = place.address_components.find(c => c.types.includes('administrative_area_level_2'));
          if (countyComp) county = countyComp.long_name;
      }
      const isAllowed = ALLOWED_COUNTIES.some(allowed => county === allowed);
      if (!isAllowed) {
          setDropOffError(`❌ Solo entregamos en Miami-Dade y Broward. (Zona: ${county || 'Desconocida'})`);
          setFormData(prev => ({ ...prev, dropOffAddress: '' }));
          return;
      }

      setDropOffError(null);
      const newDropoff = place.formatted_address!;
      setFormData(prev => ({ ...prev, dropOffAddress: newDropoff }));
      
      calculateComplexRoute(formData.originAddress, newDropoff);
  };

  useEffect(() => {
      if (serviceType === 'DELIVERY' && formData.originAddress && formData.dropOffAddress) {
          calculateComplexRoute(formData.originAddress, formData.dropOffAddress);
      }
  }, [formData.volumeTier]);

  const calculateComplexRoute = async (origin: string, destination: string) => {
    if (!isLoaded || typeof google === 'undefined' || !origin) return;

    try {
        const service = new google.maps.DistanceMatrixService();
        let totalMiles = 0;

        const getLeg = async (start: string, end: string) => {
            const res = await service.getDistanceMatrix({
                origins: [start], destinations: [end],
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.IMPERIAL
            });
            const el = res.rows[0].elements[0];
            if (el.status !== "OK") return 0;
            return el.distance.text.includes('mi') 
                ? parseFloat(el.distance.text.replace(' mi','').replace(',','')) 
                : el.distance.value / 1609.34;
        };

        if (serviceType === 'SHIPPING') {
            const leg1 = await getLeg(GMC_WAREHOUSE_ADDRESS, origin); 
            
            // 🔥 REGLA DE ORO: Solo Low Volume cobra 1 vía. El resto paga el regreso.
            if (formData.volumeTier === 'v_30') {
                totalMiles = leg1; 
            } else {
                totalMiles = leg1 * 2; 
            }
        } 
        else if (serviceType === 'DELIVERY') {
            if (!destination) return;
            
            const leg1 = await getLeg(GMC_WAREHOUSE_ADDRESS, origin); 
            const leg2 = await getLeg(origin, destination);           
            
            // 🔥 REGLA DE ORO: Solo Low Volume cobra trayecto útil. El resto paga el circuito completo.
            if (formData.volumeTier === 'v_30') {
                totalMiles = leg1 + leg2;
            } else {
                const leg3 = await getLeg(destination, GMC_WAREHOUSE_ADDRESS); 
                totalMiles = leg1 + leg2 + leg3; 
            }
        }

        setQuote(prev => ({ ...prev, distanceMiles: parseFloat(totalMiles.toFixed(1)) }));

    } catch (e) { console.error("Error calculando ruta:", e); }
  };

  const handleInputInput = () => {
      setIsAddressValid(false);
      setQuote(prev => ({ ...prev, distanceMiles: 0 }));
  };

  const validateTimeWindow = (dateTimeString: string) => {
    if (!dateTimeString) {
      setIsTimeValid(false);
      setTimeError(null);
      return;
    }

    const selectedDate = new Date(dateTimeString);
    const now = new Date();

    if (selectedDate < now) {
      setIsTimeValid(false);
      setTimeError(t.has('timeErrorPast') ? t('timeErrorPast') : "Please select a future date and time.");
      return;
    }

    const hours = selectedDate.getHours();
    
    if (hours >= 9 && hours < 16) {
      setIsTimeValid(true);
      setTimeError(null);
    } else {
      setIsTimeValid(false);
      setTimeError(t.has('timeErrorWindow') ? t('timeErrorWindow') : "Our pickup window is between 9:00 AM and 4:00 PM.");
    }
  };

  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData({...formData, pickupDate: val});
    validateTimeWindow(val);
  };

  const handlePaymentAndSubmit = async () => {
    if (serviceType !== 'PICKUP_WAREHOUSE') {
        if (!isAddressValid || !formData.originAddress) { 
            alert("⚠️ Dirección no válida. Selecciona una opción de la lista."); return; 
        }
        if (serviceType === 'DELIVERY' && !formData.dropOffAddress) {
            alert("⚠️ Faltan dirección de entrega."); return;
        }
        if (!formData.pickupDate || !isTimeValid) { alert("Completa los campos correctamente, respetando el horario."); return; }

        if (!selectedCardId) { 
            setShowMobileSummary(true); 
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
            return; 
        }
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
  const gridLayoutClass = isBodega ? 'max-w-4xl mx-auto' : 'grid grid-cols-1 lg:grid-cols-3 gap-8';

  return (
    <div className="min-h-screen w-full max-w-[100vw] bg-gray-50 pb-40 md:pb-6 font-montserrat overflow-x-hidden relative" style={{ touchAction: 'pan-y' }}>
      <div className="max-w-6xl mx-auto p-4 md:p-6 w-full">
        
        <div className="mb-6 text-center">
            <h1 className="text-xl md:text-2xl font-bold text-gmc-gris-oscuro font-garamond">{t('title')}</h1>
            <p className="text-sm text-gray-500">{t('subtitle')}</p>
        </div>

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

        {(serviceType === 'PICKUP_WAREHOUSE') && (
            <div ref={inventorySectionRef} className="scroll-mt-4 bg-orange-50 border border-orange-200 p-4 rounded-xl mb-6 flex gap-3 text-sm animate-fadeIn">
                <Info size={20} className="text-orange-600 shrink-0 mt-0.5"/>
                <div>
                    <h3 className="font-bold text-orange-900 uppercase text-xs mb-1">{t('storageRatesTitle')}</h3>
                    <p className="text-orange-800 leading-relaxed">{t('storageRatesText')}</p>
                </div>
            </div>
        )}

        {serviceType && (
            <div className={gridLayoutClass + " animate-fadeIn"}>
                <div className={isBodega ? "w-full" : "lg:col-span-2 space-y-6"}>
                    
                    {serviceType === 'PICKUP_WAREHOUSE' ? (
                        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                                <h3 className="font-bold text-gmc-gris-oscuro text-sm uppercase">{t('inventoryTitle')}</h3>
                                <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded font-bold">{t('statusReady')}</div>
                            </div>
                            
                            {inventoryLoading ? <div className="text-center py-4"><Loader2 className="animate-spin mx-auto"/></div> : inventory.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded text-gray-500">
                                    <Package className="mx-auto mb-2 text-gray-300" size={32}/>
                                   <p className="font-bold text-sm">{t('emptyPackages')}</p>
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
                                    <li>• 0-10 lbs (Mini): <strong>${FEE_MINI.toFixed(2)}</strong></li>
                                    <li>• 11-50 lbs (Estándar): <strong>${FEE_STANDARD.toFixed(2)}</strong></li>
                                    <li>• 51-150 lbs (Pesado): <strong>${FEE_HEAVY.toFixed(2)}</strong></li>
                                    <li>• +150 lbs (Carga/Pallet): <strong>${FEE_PALLET.toFixed(2)}</strong></li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div ref={routeSectionRef} className="scroll-mt-4 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                                <h3 className="font-bold text-gmc-gris-oscuro text-sm uppercase mb-2">{t('routeTitle')}</h3>
                                <div>
                                    <label className="text-xs font-bold text-gray-400">{t('pickupPointA')}</label>
                                    <Autocomplete 
                                        onLoad={ref => { originRef.current = ref }} 
                                        onPlaceChanged={handleOriginChange}
                                        restrictions={{ country: "us" }}
                                    >
                                        <input 
                                            type="text" 
                                            placeholder="Dirección de recogida..." 
                                            className={`w-full p-3 border rounded-lg text-base ${addressError ? 'border-red-500 bg-red-50 text-red-900' : 'border-gray-200'}`} 
                                            onInput={handleInputInput}
                                        />
                                    </Autocomplete>
                                    {addressError && (
                                        <div className="mt-2 flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-lg text-xs font-bold animate-in fade-in">
                                            <AlertTriangle size={16} />
                                            <span>{addressError}</span>
                                        </div>
                                    )}
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
                                        <Autocomplete 
                                            onLoad={ref => { destRef.current = ref }} 
                                            onPlaceChanged={handleDropoffChange} 
                                            restrictions={{ country: "us" }}
                                        >
                                            <input 
                                                type="text" 
                                                placeholder="Dirección de entrega..." 
                                                className={`w-full p-3 border rounded-lg text-base ${dropOffError ? 'border-red-500 bg-red-50 text-red-900' : 'border-gray-200'}`} 
                                            />
                                        </Autocomplete>
                                        {dropOffError && (
                                            <div className="mt-2 flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-lg text-xs font-bold animate-in fade-in">
                                                <AlertTriangle size={16} />
                                                <span>{dropOffError}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="font-bold text-gmc-gris-oscuro text-sm uppercase mb-4">{t('loadDetailsTitle')}</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="relative">
                                        <select 
                                            className="w-full p-3 pl-4 border border-gray-200 rounded-xl text-base bg-white appearance-none font-medium focus:ring-2 focus:ring-gmc-dorado-principal focus:border-transparent" 
                                            onChange={e => setFormData({...formData, weightTier: e.target.value})}
                                            value={formData.weightTier}
                                        >
                                            {WEIGHT_TIERS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                    </div>

                                    <div className="relative">
                                        <select 
                                            className="w-full p-3 pl-4 border border-gray-200 rounded-xl text-base bg-white appearance-none font-medium focus:ring-2 focus:ring-gmc-dorado-principal focus:border-transparent" 
                                            onChange={e => setFormData({...formData, volumeTier: e.target.value})}
                                            value={formData.volumeTier}
                                        >
                                            {VOLUME_TIERS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                    </div>
                                </div>

                                {formData.weightTier === 'w_heavy' && (
                                    <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="relative">
                                            <Weight className="absolute left-3 top-1/2 -translate-y-1/2 text-gmc-dorado-principal" size={18} />
                                            <input 
                                                type="number" 
                                                placeholder={t.has('exactWeightPlaceholder') ? t('exactWeightPlaceholder') : "Exact weight (Lbs)"} 
                                                className="w-full p-3 pl-10 border border-yellow-200 rounded-xl bg-yellow-50 text-base font-bold placeholder-yellow-600/50 focus:ring-2 focus:ring-yellow-400 focus:outline-none" 
                                                onChange={e => setFormData({...formData, exactWeight: parseFloat(e.target.value)})} 
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="relative">
                                        <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-gray-400 z-10">
                                            {t.has('pickupDateLabel') ? t('pickupDateLabel') : "Pickup Window (9am-4pm)"}
                                        </label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                            <input 
                                                type="datetime-local" 
                                                className={`w-full p-3 pl-10 border rounded-xl text-base bg-white appearance-none focus:ring-2 focus:ring-gmc-dorado-principal min-h-[46px] ${timeError ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-transparent'}`}
                                                onChange={handleDateTimeChange} 
                                            />
                                        </div>
                                        {timeError && (
                                            <div className="mt-1 flex items-center gap-1 text-red-500 text-[10px] font-bold">
                                                <Clock size={12} />
                                                <span>{timeError}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="relative">
                                         <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-gray-400 z-10">
                                             {t.has('contactLabel') ? t('contactLabel') : "Contact"}
                                         </label>
                                         <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                            <input 
                                                type="tel" 
                                                placeholder={t.has('phonePlaceholder') ? t('phonePlaceholder') : "Phone number"} 
                                                className="w-full p-3 pl-10 border border-gray-200 rounded-xl text-base bg-white focus:ring-2 focus:ring-gmc-dorado-principal focus:border-transparent min-h-[46px]" 
                                                onChange={e => setFormData({...formData, contactPhone: e.target.value})} 
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <textarea 
                                    className="w-full p-3 border border-gray-200 rounded-xl text-base h-24 resize-none focus:ring-2 focus:ring-gmc-dorado-principal focus:border-transparent" 
                                    placeholder={t.has('descPlaceholder') ? t('descPlaceholder') : "Description of items..."} 
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                ></textarea>
                            </div>
                        </>
                    )}
                </div>

               {!isBodega && (
                    <div className="hidden lg:block lg:col-span-1">
                        <div className="bg-gmc-gris-oscuro text-white p-6 rounded-2xl shadow-xl sticky top-6">
                            <h3 className="font-bold text-gmc-dorado-principal text-lg mb-4 border-b border-gray-600 pb-2">{t('summaryTitle')}</h3>
                            
                            {/* 🔥 NUESTRO BLOQUE CORREGIDO 🔥 */}
                            <div className="space-y-3 text-sm mb-4">
                                <div className="flex justify-between">
                                    <span>{t('sumService')}</span>
                                    <span className="font-mono font-bold">${quote.baseFare.toFixed(2)}</span>
                                </div>
                                {quote.distanceSurcharge > 0 && (
                                    <div className="flex justify-between">
                                        <span>{t('sumDistance')}</span>
                                        <span>+${quote.distanceSurcharge.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-400 text-xs">
                                    <span>Processing Fee</span>
                                    <span>+${quote.processingFee.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-600 text-gmc-dorado-principal">
                                    <span>{t('sumTotal')}</span>
                                    <span>${quote.total.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* 🔥 ALERTA PAGO LOCAL TRINIDAD (DESKTOP) 🔥 */}
                            {isTrinidadCard && quote.total > 0 && (
                                <div className="mt-4 p-3 bg-blue-900/40 border border-blue-500/50 rounded-xl mb-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-lg">🇹🇹</span>
                                        <p className="text-xs font-bold text-blue-300 uppercase tracking-wide">{tBills('localPaymentEnabled')}</p>
                                    </div>
                                    <p className="text-[10px] text-gray-300 mb-2">
                                        {tBills('localPaymentDesc')} ({tBills('exchangeRateLabel')}: 1 USD = {tasaTTD} TTD).
                                    </p>
                                    <div className="pt-2 border-t border-blue-500/30 flex justify-between text-sm font-black text-blue-300">
                                        <span>{tBills('amountToCharge')}</span>
                                        <span>${montoTTD} TTD</span>
                                    </div>
                                </div>
                            )}

                            <div className="mb-4">
                                <p className="text-xs font-bold text-gray-400 mb-2 uppercase">{t('paymentTitle')}</p>
                                {cards.length > 0 ? (
                                    <div className="bg-gray-700 p-3 rounded flex items-center justify-between border border-gray-600">
                                        <div className="flex items-center gap-2"><CreditCard size={16}/><span className="text-xs">•••• {cards.find(c => c.id === selectedCardId)?.last4}</span></div>
                                        <Link href="/account-settings" className="text-xs text-gmc-dorado-principal">{t('btnChange')}</Link>
                                    </div>
                                ) : <Link href="/account-settings" className="block text-center text-xs p-2 bg-gray-700 rounded text-white">+ Agregar Tarjeta</Link>}
                            </div>
                            <button onClick={handlePaymentAndSubmit} disabled={isLoading || quote.total === 0 || !isAddressValid || !isTimeValid} className="w-full py-3 bg-gmc-dorado-principal text-gmc-gris-oscuro font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-white transition-colors disabled:opacity-50">
                                {isLoading ? <Loader2 className="animate-spin"/> : <CreditCard size={18}/>} {t('btnPay')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}

        {serviceType && !isBodega && (
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
                <div className="absolute bottom-full left-0 right-0 h-10 bg-gradient-to-t from-gray-200/50 to-transparent pointer-events-none" />
                <div className="bg-[#222b3c] rounded-t-3xl shadow-[0_-5px_25px_rgba(0,0,0,0.2)] p-5 animate-slideUp text-white">
                    <div className="flex justify-between items-center gap-4">
                        <div onClick={() => setShowMobileSummary(!showMobileSummary)} className="flex flex-col cursor-pointer">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-[#EAD8B1] uppercase tracking-widest mb-0.5">
                                {t('sumTotal')} <ChevronUp size={12} className={`transition-transform text-white ${showMobileSummary ? 'rotate-180' : ''}`}/>
                            </div>
                            <div className="text-3xl font-garamond font-bold leading-none text-white">${quote.total.toFixed(2)}</div>
                        </div>

                        <button 
                            onClick={handlePaymentAndSubmit} 
                            disabled={isLoading || quote.total === 0 || !isAddressValid || !isTimeValid} 
                            className="bg-[#EAD8B1] text-[#222b3c] px-8 py-3.5 rounded-xl font-bold text-base shadow-lg active:scale-95 transition-transform flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20}/> : <CreditCard size={20}/>} 
                            {t('btnPay')}
                        </button>
                    </div>

                    {showMobileSummary && (
                        <div className="mt-5 pt-5 border-t border-gray-600 animate-fadeIn text-sm space-y-3">
                            <div className="flex justify-between text-gray-300">
                                <span>Service Base</span>
                                <span>${quote.baseFare.toFixed(2)}</span>
                            </div>
                            {quote.distanceSurcharge > 0 && (
                                <div className="flex justify-between text-blue-300"><span>Distance Surcharge</span><span>+${quote.distanceSurcharge.toFixed(2)}</span></div>
                            )}
                            <div className="flex justify-between text-gray-400 text-xs">
                                <span>Processing Fee</span>
                                <span>+${quote.processingFee.toFixed(2)}</span>
                            </div>
                            
                            {isTrinidadCard && quote.total > 0 && (
                                <div className="mt-3 p-3 bg-blue-900/40 border border-blue-500/50 rounded-xl mb-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-lg">🇹🇹</span>
                                        <p className="text-xs font-bold text-blue-300 uppercase tracking-wide">{tBills('localPaymentEnabled')}</p>
                                    </div>
                                    <p className="text-[10px] text-gray-300 mb-2">
                                        {tBills('localPaymentDesc')} ({tBills('exchangeRateLabel')}: 1 USD = {tasaTTD} TTD).
                                    </p>
                                    <div className="pt-2 border-t border-blue-500/30 flex justify-between text-sm font-black text-blue-300">
                                        <span>{tBills('amountToCharge')}</span>
                                        <span>${montoTTD} TTD</span>
                                    </div>
                                </div>
                            )}
                            
                            <div className="pt-4 mt-2 border-t border-gray-600">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">PAYING WITH</label>
                                {cards.length > 0 ? (
                                    <div className="flex items-center justify-between bg-gray-700/50 p-3 rounded-xl border border-gray-600">
                                        <div className="flex items-center gap-3">
                                            <CreditCard size={16} className="text-gray-300"/>
                                            <span className="font-mono text-xs font-bold text-white">•••• {cards.find(c => c.id === selectedCardId)?.last4}</span>
                                        </div>
                                        <Link href="/account-settings" className="text-[10px] text-[#EAD8B1] font-bold uppercase tracking-wider hover:underline">Change</Link>
                                    </div>
                                ) : <Link href="/account-settings" className="text-xs text-blue-400 underline font-bold flex items-center gap-1">+ Add Card</Link>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

      </div>
    </div>
  );
}