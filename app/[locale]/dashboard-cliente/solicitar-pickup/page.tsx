"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Truck, MapPin, Warehouse, CreditCard, Info, Loader2, Package, Check,
    ChevronDown, ChevronUp, Calendar, Phone, Weight, AlertTriangle, Clock,
    Car, Ruler
} from 'lucide-react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { getProcessingFee } from '@/lib/stripeCalc';
import { useTranslations } from 'next-intl';

// 🔥 IMPORTAMOS EL MOTOR AURA ENTERPRISE
import { calculateAuraLocalDelivery, getVehicleByWeight, AuraBox } from '@/lib/aura-engine';

// --- CONFIGURACIÓN DE TARIFAS (HANDLING RATES SOLO PARA BODEGA) ---
const FEE_MINI = 2.50;       // 0-10 lbs
const FEE_STANDARD = 5.00;   // 11-50 lbs
const FEE_HEAVY = 12.50;     // 51-150 lbs
const FEE_PALLET = 30.00;    // +150 lbs

const GMC_WAREHOUSE_ADDRESS = "1861 NW 22nd St, Miami, FL 33142";
const ALLOWED_COUNTIES = ['Miami-Dade County', 'Broward County'];
const GOOGLE_LIBRARIES: ("places")[] = ["places"];

// 🔥 RATE TABLE VISUAL — 13 rangos + 151+ (igual que cotizador público)
const WEIGHT_OPTIONS = [
    { id: 'w_0_40',    label: '0 - 40 Lbs',              estWeight: 40 },
    { id: 'w_41_50',   label: '41 - 50 Lbs',             estWeight: 50 },
    { id: 'w_51_60',   label: '51 - 60 Lbs',             estWeight: 60 },
    { id: 'w_61_70',   label: '61 - 70 Lbs',             estWeight: 70 },
    { id: 'w_71_80',   label: '71 - 80 Lbs',             estWeight: 80 },
    { id: 'w_81_90',   label: '81 - 90 Lbs',             estWeight: 90 },
    { id: 'w_91_100',  label: '91 - 100 Lbs',            estWeight: 100 },
    { id: 'w_101_110', label: '101 - 110 Lbs',           estWeight: 110 },
    { id: 'w_111_120', label: '111 - 120 Lbs',           estWeight: 120 },
    { id: 'w_121_130', label: '121 - 130 Lbs',           estWeight: 130 },
    { id: 'w_131_140', label: '131 - 140 Lbs',           estWeight: 140 },
    { id: 'w_141_150', label: '141 - 150 Lbs',           estWeight: 150 },
    { id: 'w_151_plus', label: '151+ Lbs (Pallet / Heavy)', estWeight: 0 },
];

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

  // 🚛 VEHICLE INFO MAP (traducido, igual que cotizador público)
  const VEHICLE_DISPLAY: Record<string, { icon: React.ReactNode; title: string; desc: string; dims: string }> = {
      CAR_SUV: {
          icon: <Car size={22} className="text-blue-600" />,
          title: t('volLow'),
          desc: t.has('carSuvDesc') ? t('carSuvDesc') : 'Small boxes, documents (0-50 lbs)',
          dims: t.has('carSuvDims') ? t('carSuvDims') : 'Max. 4 ft long'
      },
      MINIVAN: {
          icon: <Truck size={22} className="text-green-600" />,
          title: t('volMed'),
          desc: t.has('minivanDesc') ? t('minivanDesc') : 'Small furniture, medium boxes (51-150 lbs)',
          dims: t.has('minivanDims') ? t('minivanDims') : 'Max. 7 ft long · 4 ft tall'
      },
      CARGO_VAN: {
          icon: <Warehouse size={22} className="text-orange-600" />,
          title: t('volHigh'),
          desc: t.has('cargoVanDesc') ? t('cargoVanDesc') : '1-2 pallets, heavy cargo (151-800 lbs)',
          dims: t.has('cargoVanDims') ? t('cargoVanDims') : 'Max. 12 ft long · 6 ft tall'
      },
      BOX_TRUCK: {
          icon: <Package size={22} className="text-red-600" />,
          title: t('volFull'),
          desc: t.has('boxTruckDesc') ? t('boxTruckDesc') : '2+ pallets, oversized (800+ lbs)',
          dims: t.has('boxTruckDims') ? t('boxTruckDims') : 'Max. 20 ft long · 8 ft tall'
      }
  };

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const isPayingRef = useRef(false);

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
    weightTier: 'w_0_40', exactWeight: 0,
    heavyVehicle: 'CARGO_VAN', palletCount: 1,
    termsAccepted: false
  });

  // 🔥 PESO CALCULADO (igual que cotizador público)
  const calcWeight = useMemo(() => {
      if (formData.weightTier === 'w_151_plus') {
          return formData.exactWeight > 0 ? formData.exactWeight : 151;
      }
      const tier = WEIGHT_OPTIONS.find(w => w.id === formData.weightTier);
      return tier?.estWeight || 40;
  }, [formData.weightTier, formData.exactWeight]);

  // 🔥 VEHÍCULO AUTO-ASIGNADO (igual que cotizador público)
  const autoVehicle = useMemo(() => {
      if (formData.weightTier === 'w_151_plus') {
          // Para 151+, el cliente elige entre Cargo Van y Box Truck
          return formData.heavyVehicle === 'BOX_TRUCK'
              ? { type: 'BOX_TRUCK', rate: 2.50, maxLength: '20 ft', maxHeight: '8 ft' }
              : { type: 'CARGO_VAN', rate: 1.75, maxLength: '12 ft', maxHeight: '6 ft' };
      }
      return getVehicleByWeight(calcWeight);
  }, [calcWeight, formData.weightTier, formData.heavyVehicle]);

  const vehicleInfo = VEHICLE_DISPLAY[autoVehicle.type] || VEHICLE_DISPLAY.CAR_SUV;
  const isPalletMode = formData.weightTier === 'w_151_plus';

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

  // --- 2. MANEJO DE SELECCIÓN (con auto-scroll a la sección correcta) ---
  const handleServiceSelect = (type: string) => {
      setServiceType(type);
      setAddressError(null);
      setDropOffError(null);
      setTimeError(null);
      setQuote(prev => ({ ...prev, distanceMiles: 0, distanceSurcharge: 0 }));
      setTimeout(() => {
          const target = type === 'PICKUP_WAREHOUSE' ? inventorySectionRef.current : routeSectionRef.current;
          target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
  };

  // --- 3. CÁLCULOS (AURA ENGINE + VEHICLE OVERRIDE, igual que cotizador público) ---
  useEffect(() => {
    if (!isLoaded && serviceType !== 'PICKUP_WAREHOUSE') return;

    const calculateTotal = () => {
        let subtotal = 0;
        let baseFare = 0;
        let distanceSurcharge = 0;

        // A. LÓGICA DE BODEGA (Retiro Personal - Handling Fee)
        if (serviceType === 'PICKUP_WAREHOUSE') {
             let totalHandling = 0;
             if (inventory && inventory.length > 0) {
                 inventory.forEach(pkg => {
                     const weight = pkg.weight || pkg.peso || 1;
                     if (weight <= 10) totalHandling += FEE_MINI;
                     else if (weight <= 50) totalHandling += FEE_STANDARD;
                     else if (weight <= 150) totalHandling += FEE_HEAVY;
                     else totalHandling += FEE_PALLET;
                 });
             }
             subtotal = totalHandling;
             baseFare = totalHandling;
        }
        // B. LÓGICA DE CALLE (Pickup / Delivery con AURA ENTERPRISE)
        else {
            const simulatedBox: AuraBox = {
                length: 10, width: 10, height: 10,
                realWeight: calcWeight
            };

            const auraQuote = calculateAuraLocalDelivery([simulatedBox], quote.distanceMiles);

            // Override: modo pallet cobra $150 por pallet
            baseFare = auraQuote.baseFare;
            if (isPalletMode) {
                baseFare = formData.palletCount * 150;
            }

            // Override distancia con la tarifa del vehículo asignado (radio base 10 mi)
            if (quote.distanceMiles > 10) {
                distanceSurcharge = parseFloat(((quote.distanceMiles - 10) * autoVehicle.rate).toFixed(2));
            }

            subtotal = baseFare + distanceSurcharge;
        }

        const fee = subtotal > 0 ? getProcessingFee(subtotal) : 0;

        setQuote(prev => ({
            ...prev,
            baseFare,
            distanceSurcharge,
            subtotal,
            processingFee: fee,
            total: subtotal + fee,
            appliedStrategy: serviceType === 'PICKUP_WAREHOUSE' ? 'HANDLING_FEE' : 'AURA_ENGINE'
        }));
    };

    calculateTotal();
  }, [calcWeight, quote.distanceMiles, isLoaded, serviceType, inventory, autoVehicle.rate, formData.palletCount, formData.heavyVehicle, isPalletMode]);

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
  };

  // --- DISTANCE RECALC ---
  useEffect(() => {
    if (!isLoaded || !serviceType || serviceType === 'PICKUP_WAREHOUSE') return;

    if (serviceType === 'SHIPPING' && formData.originAddress) {
        calculateComplexRoute(formData.originAddress, '');
    }
    if (serviceType === 'DELIVERY' && formData.originAddress && formData.dropOffAddress) {
        calculateComplexRoute(formData.originAddress, formData.dropOffAddress);
    }
  }, [formData.originAddress, formData.dropOffAddress, serviceType, isLoaded, autoVehicle.type]);

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
            // 🔥 REGLA AURA: Box Truck cobra circuito completo (ida y vuelta)
            totalMiles = (autoVehicle.type === 'BOX_TRUCK') ? leg1 * 2 : leg1;
        }
        else if (serviceType === 'DELIVERY') {
            if (!destination) return;

            const leg1 = await getLeg(GMC_WAREHOUSE_ADDRESS, origin);
            const leg2 = await getLeg(origin, destination);

            if (autoVehicle.type === 'BOX_TRUCK') {
                const leg3 = await getLeg(destination, GMC_WAREHOUSE_ADDRESS);
                totalMiles = leg1 + leg2 + leg3;
            } else {
                totalMiles = leg1 + leg2;
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

    if (isPayingRef.current) return;
    isPayingRef.current = true;

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
    finally {
        setIsLoading(false);
        isPayingRef.current = false;
    }
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

                                {/* 🔥 WEIGHT SELECTOR (Granular, igual que cotizador público) */}
                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">
                                        {t('weightQuestion')}
                                    </label>
                                    <div className="relative">
                                        <select
                                            className="w-full p-3 pl-4 border border-gray-200 rounded-xl text-base bg-white appearance-none font-medium focus:ring-2 focus:ring-gmc-dorado-principal focus:border-transparent"
                                            onChange={e => setFormData({ ...formData, weightTier: e.target.value, exactWeight: 0 })}
                                            value={formData.weightTier}
                                        >
                                            {WEIGHT_OPTIONS.map(opt => (
                                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                    </div>
                                </div>

                                {/* 🔥 151+ LBS: Peso exacto + Selector de vehículo + Pallets */}
                                {isPalletMode && (
                                    <div className="space-y-4 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        {/* Exact Weight Input */}
                                        <div className="relative">
                                            <Weight className="absolute left-3 top-1/2 -translate-y-1/2 text-gmc-dorado-principal" size={18} />
                                            <input
                                                type="number"
                                                placeholder={t.has('exactWeightPlaceholder') ? t('exactWeightPlaceholder') : "Exact weight (Lbs)"}
                                                className="w-full p-3 pl-10 border border-yellow-200 rounded-xl bg-yellow-50 text-base font-bold placeholder-yellow-600/50 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                                onChange={e => setFormData({ ...formData, exactWeight: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>

                                        {/* Vehicle Selector (Only Cargo Van / Box Truck) */}
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">{t('selectVehicleLabel')}</label>
                                        <div className="grid grid-cols-1 gap-3">
                                            {/* Cargo Van */}
                                            <div
                                                onClick={() => setFormData({ ...formData, heavyVehicle: 'CARGO_VAN' })}
                                                className={`group relative flex items-center p-4 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${formData.heavyVehicle === 'CARGO_VAN' ? 'border-gmc-dorado-principal bg-yellow-50/30 shadow-md' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                                            >
                                                {formData.heavyVehicle === 'CARGO_VAN' && (
                                                    <div className="absolute top-1/2 -translate-y-1/2 -left-3 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center shadow-sm z-10">
                                                        <Check size={14} strokeWidth={3} />
                                                    </div>
                                                )}
                                                <div className="w-14 h-12 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center mr-4 shrink-0">
                                                    <Warehouse size={22} className="text-orange-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-gray-800 text-sm">{t('volHigh')}</h4>
                                                    <p className="text-xs text-gray-500 leading-tight mt-0.5">{VEHICLE_DISPLAY.CARGO_VAN.desc}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><Ruler size={10} /> {VEHICLE_DISPLAY.CARGO_VAN.dims}</p>
                                                </div>
                                            </div>

                                            {/* Box Truck */}
                                            <div
                                                onClick={() => setFormData({ ...formData, heavyVehicle: 'BOX_TRUCK' })}
                                                className={`group relative flex items-center p-4 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${formData.heavyVehicle === 'BOX_TRUCK' ? 'border-gmc-dorado-principal bg-yellow-50/30 shadow-md' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                                            >
                                                {formData.heavyVehicle === 'BOX_TRUCK' && (
                                                    <div className="absolute top-1/2 -translate-y-1/2 -left-3 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center shadow-sm z-10">
                                                        <Check size={14} strokeWidth={3} />
                                                    </div>
                                                )}
                                                <div className="w-14 h-12 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center mr-4 shrink-0">
                                                    <Package size={22} className="text-red-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-gray-800 text-sm">{t('volFull')}</h4>
                                                    <p className="text-xs text-gray-500 leading-tight mt-0.5">{VEHICLE_DISPLAY.BOX_TRUCK.desc}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><Ruler size={10} /> {VEHICLE_DISPLAY.BOX_TRUCK.dims}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 🔥 PALLET COUNT */}
                                        <div className="mt-4 p-4 bg-red-50/30 border border-red-100 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-3">
                                                {t('howManyPallets')}
                                            </label>
                                            <div className="flex gap-2">
                                                {(formData.heavyVehicle === 'CARGO_VAN' ? [1, 2] : [2, 3, 4, 5, 6]).map(num => (
                                                    <button
                                                        key={num}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, palletCount: num })}
                                                        className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all ${
                                                            formData.palletCount === num
                                                                ? 'bg-gmc-dorado-principal text-black shadow-md scale-105'
                                                                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
                                                        }`}
                                                    >
                                                        {num}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-[11px] text-gray-500 mt-2 text-center">
                                                {formData.palletCount} pallets × $150 = <strong>${(formData.palletCount * 150).toFixed(2)}</strong>
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* 🔥 AUTO VEHICLE INFO (0-150 lbs) */}
                                {!isPalletMode && (
                                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl mb-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                                                {vehicleInfo.icon}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">
                                                    {t.has('vehicleLabel') ? t('vehicleLabel') : 'Vehicle:'} {vehicleInfo.title}
                                                </p>
                                                <p className="text-[10px] text-gray-500">{vehicleInfo.desc}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-100 w-fit">
                                            <Ruler size={12} className="text-gmc-dorado-principal" />
                                            <span className="font-medium">{vehicleInfo.dims}</span>
                                        </div>

                                        {/* Dimension validation hint */}
                                        <div className="mt-3 p-2.5 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2">
                                            <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
                                            <p className="text-[11px] text-amber-800 leading-snug">
                                                {t.has('dimensionHint')
                                                    ? <>{t('dimensionHint', { maxLength: '' })}<strong>{autoVehicle.maxLength}</strong></>
                                                    : <>Does your longest item exceed <strong>{autoVehicle.maxLength}</strong>?</>
                                                }
                                            </p>
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

                            {/* Vehicle badge (igual que cotizador público) */}
                            <div className="flex items-center gap-2 p-3 bg-gray-700/50 rounded-xl border border-gray-600 mb-4">
                                <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                                    {vehicleInfo.icon}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white">{vehicleInfo.title}</p>
                                    <p className="text-[10px] text-gray-400">{vehicleInfo.dims}</p>
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

                            <div className="flex items-center gap-2 pt-3 border-t border-gray-600">
                                <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">{vehicleInfo.icon}</div>
                                <span className="text-xs text-gray-400">{vehicleInfo.title} · {vehicleInfo.dims}</span>
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