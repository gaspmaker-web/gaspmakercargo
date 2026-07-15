"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
    Truck, MapPin, Loader2, Package, Check,
    ChevronDown, ChevronUp, Weight, AlertTriangle,
    Car, Warehouse, Globe, ArrowRight, ShieldCheck, UserPlus, Ruler, Info
} from 'lucide-react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { getProcessingFee } from '@/lib/stripeCalc';
import { calculateAuraLocalDelivery, getVehicleByWeight, AuraBox } from '@/lib/aura-engine';

const GMC_WAREHOUSE_ADDRESS = "1861 NW 22nd St, Miami, FL 33142";
const ALLOWED_COUNTIES = ['Miami-Dade County', 'Broward County'];
const GOOGLE_LIBRARIES: ("places")[] = ["places"];

// 🔥 RATE TABLE VISUAL — 13 rangos + 151+
const WEIGHT_OPTIONS = [
    { id: 'w_0_40',   label: '0 - 40 Lbs',     estWeight: 40 },
    { id: 'w_41_50',  label: '41 - 50 Lbs',     estWeight: 50 },
    { id: 'w_51_60',  label: '51 - 60 Lbs',     estWeight: 60 },
    { id: 'w_61_70',  label: '61 - 70 Lbs',     estWeight: 70 },
    { id: 'w_71_80',  label: '71 - 80 Lbs',     estWeight: 80 },
    { id: 'w_81_90',  label: '81 - 90 Lbs',     estWeight: 90 },
    { id: 'w_91_100', label: '91 - 100 Lbs',    estWeight: 100 },
    { id: 'w_101_110',label: '101 - 110 Lbs',   estWeight: 110 },
    { id: 'w_111_120',label: '111 - 120 Lbs',   estWeight: 120 },
    { id: 'w_121_130',label: '121 - 130 Lbs',   estWeight: 130 },
    { id: 'w_131_140',label: '131 - 140 Lbs',   estWeight: 140 },
    { id: 'w_141_150',label: '141 - 150 Lbs',   estWeight: 150 },
    { id: 'w_151_plus', label: '151+ Lbs (Pallet / Heavy)', estWeight: 0 },
];



export default function PublicQuotePage() {
    const t = useTranslations('Pickup');
    const locale = useLocale();

    // 🚛 VEHICLE INFO MAP (traducido)
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

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "",
        libraries: GOOGLE_LIBRARIES
    });

    const [serviceType, setServiceType] = useState<string | null>(null);
    const [addressError, setAddressError] = useState<string | null>(null);
    const [dropOffError, setDropOffError] = useState<string | null>(null);
    const [isAddressValid, setIsAddressValid] = useState(false);
    const [showMobileSummary, setShowMobileSummary] = useState(false);

    const [quote, setQuote] = useState({
        total: 0, subtotal: 0, processingFee: 0, baseFare: 0, distanceSurcharge: 0, distanceMiles: 0
    });

    const originRef = useRef<google.maps.places.Autocomplete | null>(null);
    const destRef = useRef<google.maps.places.Autocomplete | null>(null);
    const formSectionRef = useRef<HTMLDivElement>(null);
    const serviceSelectorRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    originAddress: '', dropOffAddress: '',
    weightTier: 'w_0_40',
    exactWeight: 0,
    heavyVehicle: 'CARGO_VAN',
    palletCount: 1
});

    // 🔥 PESO CALCULADO
    const calcWeight = useMemo(() => {
        if (formData.weightTier === 'w_151_plus') {
            return formData.exactWeight > 0 ? formData.exactWeight : 151;
        }
        const tier = WEIGHT_OPTIONS.find(t => t.id === formData.weightTier);
        return tier?.estWeight || 40;
    }, [formData.weightTier, formData.exactWeight]);

    // 🔥 VEHÍCULO AUTO-ASIGNADO
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
// --- CÁLCULOS (AURA ENGINE + VEHICLE OVERRIDE) ---
useEffect(() => {
    if (!isLoaded || !serviceType) return;

    const simulatedBox: AuraBox = {
        length: 10, width: 10, height: 10,
        realWeight: calcWeight
    };

    const auraQuote = calculateAuraLocalDelivery([simulatedBox], quote.distanceMiles);
    
    // Override: Box Truck cobra $150 por pallet
    let finalBaseFare = auraQuote.baseFare;
    if (isPalletMode) {
    finalBaseFare = formData.palletCount * 150;
}

    // Override distancia con el vehículo seleccionado
    let finalDistanceSurcharge = 0;
    if (quote.distanceMiles > 10) {
        finalDistanceSurcharge = parseFloat(((quote.distanceMiles - 10) * autoVehicle.rate).toFixed(2));
    }

    const subtotal = finalBaseFare + finalDistanceSurcharge;
    const fee = subtotal > 0 ? getProcessingFee(subtotal) : 0;

    setQuote(prev => ({
        ...prev,
        baseFare: finalBaseFare,
        distanceSurcharge: finalDistanceSurcharge,
        subtotal,
        processingFee: fee,
        total: subtotal + fee
    }));
}, [calcWeight, quote.distanceMiles, isLoaded, serviceType, autoVehicle.rate, formData.palletCount, formData.heavyVehicle]);

    // --- DISTANCE RECALC ---
    useEffect(() => {
        if (!isLoaded || !serviceType) return;
        if (serviceType === 'SHIPPING' && formData.originAddress) {
            calculateComplexRoute(formData.originAddress, '');
        }
        if (serviceType === 'DELIVERY' && formData.originAddress && formData.dropOffAddress) {
            calculateComplexRoute(formData.originAddress, formData.dropOffAddress);
        }
    }, [formData.originAddress, formData.dropOffAddress, serviceType, isLoaded]);

    // --- MAPS ---
    const handleOriginChange = () => {
        if (!originRef.current) return;
        const place = originRef.current.getPlace();
        if (!place || !place.geometry || !place.formatted_address) {
            setAddressError("⚠️ Invalid address. Select from the list.");
            setIsAddressValid(false);
            setFormData(prev => ({ ...prev, originAddress: '' }));
            return;
        }
        let county = '';
        if (place.address_components) {
            const countyComp = place.address_components.find(c => c.types.includes('administrative_area_level_2'));
            if (countyComp) county = countyComp.long_name;
        }
        if (!ALLOWED_COUNTIES.some(a => county === a)) {
            setAddressError(`❌ Miami-Dade & Broward only. (Zone: ${county || 'Unknown'})`);
            setIsAddressValid(false);
            setFormData(prev => ({ ...prev, originAddress: '' }));
            return;
        }
        setAddressError(null);
        setIsAddressValid(true);
        setFormData(prev => ({ ...prev, originAddress: place.formatted_address! }));
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
        if (!ALLOWED_COUNTIES.some(a => county === a)) {
            setDropOffError(`❌ Miami-Dade & Broward only. (Zone: ${county || 'Unknown'})`);
            setFormData(prev => ({ ...prev, dropOffAddress: '' }));
            return;
        }
        setDropOffError(null);
        setFormData(prev => ({ ...prev, dropOffAddress: place.formatted_address! }));
    };

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
                    ? parseFloat(el.distance.text.replace(' mi', '').replace(',', ''))
                    : el.distance.value / 1609.34;
            };

            if (serviceType === 'SHIPPING') {
                const leg1 = await getLeg(GMC_WAREHOUSE_ADDRESS, origin);
                totalMiles = (autoVehicle.type === 'BOX_TRUCK') ? leg1 * 2 : leg1;
            } else if (serviceType === 'DELIVERY') {
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
        } catch (e) { console.error("Route error:", e); }
    };

    const handleInputInput = () => {
        setIsAddressValid(false);
        setQuote(prev => ({ ...prev, distanceMiles: 0 }));
    };

  const handleServiceSelect = (type: string) => {
    setServiceType(type);
    setAddressError(null);
    setDropOffError(null);
    setQuote(prev => ({ ...prev, distanceMiles: 0, distanceSurcharge: 0 }));
    setTimeout(() => {
        formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
};

    if (!isLoaded) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gmc-dorado-principal" size={32} /></div>;

    return (
        <div className="min-h-screen bg-gray-50 font-montserrat">

            {/* HERO */}
            <div className="relative bg-[#1a1f2e] text-white pt-24 pb-32 px-4 text-center overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gmc-dorado-principal/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] -ml-40 -mb-20 pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
                        <Globe size={12} className="text-gmc-dorado-principal" />
                        <span className="text-xs font-bold tracking-wider text-gray-200 uppercase">
                            Gasp Maker Cargo
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold font-garamond text-white tracking-tight">
                        {t.has('publicQuoteTitle') ? t('publicQuoteTitle') : 'Get an Instant Quote'}
                    </h1>
                    <p className="text-gray-300 mt-4 text-lg max-w-2xl mx-auto font-light">
                        {t.has('publicQuoteSubtitle') ? t('publicQuoteSubtitle') : 'Select a service and get your estimated price in seconds.'}
                    </p>
                </div>
            </div>

            {/* SERVICE SELECTOR */}
<div ref={serviceSelectorRef} className="max-w-4xl mx-auto px-4 -mt-16 relative z-20 scroll-mt-24">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <button
                        onClick={() => handleServiceSelect('SHIPPING')}
                        className={`p-8 rounded-2xl border-2 transition-all duration-300 text-left group hover:-translate-y-1 hover:shadow-xl ${serviceType === 'SHIPPING' ? 'border-blue-500 bg-blue-50 shadow-lg' : 'border-gray-200 bg-white shadow-md'}`}
                    >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-colors ${serviceType === 'SHIPPING' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                            <Truck size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 font-garamond mb-1">{t.has('tabShipping') ? t('tabShipping') : 'Intl. Shipping'}</h3>
                        <p className="text-sm text-gray-500">{t.has('descShipping') ? t('descShipping') : 'International'}</p>
                        <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 font-medium">
                            <ShieldCheck size={14} className="text-green-500" />
                            <span>{t.has('tagGuarantee') ? t('tagGuarantee') : 'GMC Guarantee'}</span>
                        </div>
                    </button>

                    <button
                        onClick={() => handleServiceSelect('DELIVERY')}
                        className={`p-8 rounded-2xl border-2 transition-all duration-300 text-left group hover:-translate-y-1 hover:shadow-xl ${serviceType === 'DELIVERY' ? 'border-green-500 bg-green-50 shadow-lg' : 'border-gray-200 bg-white shadow-md'}`}
                    >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-colors ${serviceType === 'DELIVERY' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 group-hover:bg-green-50 group-hover:text-green-500'}`}>
                            <MapPin size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 font-garamond mb-1">{t.has('tabDelivery') ? t('tabDelivery') : 'Local Delivery'}</h3>
                        <p className="text-sm text-gray-500">{t.has('descDelivery') ? t('descDelivery') : 'Move in Miami'}</p>
                        <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 font-medium">
                            <ShieldCheck size={14} className="text-green-500" />
                            <span>{t.has('tagGuarantee') ? t('tagGuarantee') : 'GMC Guarantee'}</span>
                        </div>
                    </button>
                </div>
            </div>

           {/* QUOTE FORM */}
{serviceType && (
    <div ref={formSectionRef} className="max-w-5xl mx-auto px-4 pb-20 animate-fadeIn scroll-mt-24">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* LEFT: FORM */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* ADDRESSES */}
                            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                                <h3 className="font-bold text-gmc-gris-oscuro text-sm uppercase mb-2">
                                    {t.has('routeTitle') ? t('routeTitle') : 'Route'}
                                </h3>

                                <div>
                                    <label className="text-xs font-bold text-gray-400">{t.has('pickupPointA') ? t('pickupPointA') : 'Pickup Point (A)'}</label>
                                    <Autocomplete onLoad={ref => { originRef.current = ref }} onPlaceChanged={handleOriginChange} restrictions={{ country: "us" }}>
                                        <input type="text" placeholder="Pickup address..." className={`w-full p-3 border rounded-lg text-base ${addressError ? 'border-red-500 bg-red-50 text-red-900' : 'border-gray-200'}`} onInput={handleInputInput} />
                                    </Autocomplete>
                                    {addressError && (
                                        <div className="mt-2 flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-lg text-xs font-bold">
                                            <AlertTriangle size={16} /><span>{addressError}</span>
                                        </div>
                                    )}
                                </div>

                                {serviceType === 'SHIPPING' && (
                                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-full text-blue-600 shadow-sm"><Warehouse size={18} /></div>
                                        <div>
                                            <p className="text-xs font-bold text-blue-800 uppercase">{t.has('interDestTitle') ? t('interDestTitle') : 'Destination'}</p>
                                            <p className="text-sm font-bold text-gray-700">{t.has('gmcWarehouse') ? t('gmcWarehouse') : 'GMC Warehouse — Miami, FL'}</p>
                                            <p className="text-[10px] text-gray-500">{t.has('exportNote') ? t('exportNote') : 'For international export'}</p>
                                        </div>
                                    </div>
                                )}

                                {serviceType === 'DELIVERY' && (
                                    <div>
                                        <label className="text-xs font-bold text-gray-400">{t.has('dropoffPointB') ? t('dropoffPointB') : 'Drop-off Point (B)'}</label>
                                        <Autocomplete onLoad={ref => { destRef.current = ref }} onPlaceChanged={handleDropoffChange} restrictions={{ country: "us" }}>
                                            <input type="text" placeholder="Delivery address..." className={`w-full p-3 border rounded-lg text-base ${dropOffError ? 'border-red-500 bg-red-50 text-red-900' : 'border-gray-200'}`} />
                                        </Autocomplete>
                                        {dropOffError && (
                                            <div className="mt-2 flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-lg text-xs font-bold">
                                                <AlertTriangle size={16} /><span>{dropOffError}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* LOAD DETAILS */}
                            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="font-bold text-gmc-gris-oscuro text-sm uppercase mb-4">
                                    {t.has('loadDetailsTitle') ? t('loadDetailsTitle') : 'Load Details'}
                                </h3>

                                {/* 🔥 WEIGHT SELECTOR (Granular) */}
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

                                {/* 🔥 151+ LBS: Peso exacto + Selector de vehículo */}
                                {isPalletMode && (
                                    <div className="space-y-4 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        {/* Exact Weight Input */}
                                        <div className="relative">
                                            <Weight className="absolute left-3 top-1/2 -translate-y-1/2 text-gmc-dorado-principal" size={18} />
                                            <input
                                                type="number"
                                                placeholder={t('exactWeightPlaceholder')}
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

                                        {/* 🔥 PALLET COUNT (Solo Box Truck) */}
                                        {(formData.heavyVehicle === 'BOX_TRUCK' || formData.heavyVehicle === 'CARGO_VAN') && (
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
                                        )}
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
                            </div>
                        </div>

                        {/* RIGHT: QUOTE SUMMARY (DESKTOP) */}
                        <div className="hidden lg:block lg:col-span-1">
                            <div className="bg-gmc-gris-oscuro text-white p-6 rounded-2xl shadow-xl sticky top-6">
                                <h3 className="font-bold text-gmc-dorado-principal text-lg mb-4 border-b border-gray-600 pb-2">
                                    {t.has('summaryTitle') ? t('summaryTitle') : 'Quote Summary'}
                                </h3>

                                <div className="space-y-3 text-sm mb-4">
                                    <div className="flex justify-between">
                                        <span>{t.has('sumService') ? t('sumService') : 'Service'}</span>
                                        <span className="font-mono font-bold">${quote.baseFare.toFixed(2)}</span>
                                    </div>
                                    {quote.distanceSurcharge > 0 && (
                                        <div className="flex justify-between">
                                            <span>{t.has('sumDistance') ? t('sumDistance') : 'Distance'}</span>
                                            <span>+${quote.distanceSurcharge.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-gray-400 text-xs">
                                        <span>Processing Fee</span>
                                        <span>+${quote.processingFee.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-600 text-gmc-dorado-principal">
                                        <span>{t.has('sumTotal') ? t('sumTotal') : 'Total'}</span>
                                        <span>${quote.total.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Vehicle badge */}
                                <div className="flex items-center gap-2 p-3 bg-gray-700/50 rounded-xl border border-gray-600 mb-4">
                                    <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                                        {vehicleInfo.icon}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white">{vehicleInfo.title}</p>
                                        <p className="text-[10px] text-gray-400">{vehicleInfo.dims}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 mt-4">
                                    <Link
                                        href={`/${locale}/registro-cliente`}
                                        className="w-full py-3 bg-gmc-dorado-principal text-gmc-gris-oscuro font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-white transition-colors"
                                    >
                                        <UserPlus size={18} />
                                        {t.has('btnCreateAccount') ? t('btnCreateAccount') : 'Create Account to Book'}
                                    </Link>
                                    <Link
                                        href={`/${locale}/login-cliente`}
                                        className="w-full py-2.5 bg-transparent text-gray-400 font-bold rounded-xl flex justify-center items-center gap-2 hover:text-white transition-colors text-sm border border-gray-600 hover:border-gray-400"
                                    >
                                        {t.has('btnAlreadyAccount') ? t('btnAlreadyAccount') : 'Already have an account? Log in'}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MOBILE BOTTOM BAR */}
                    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
                        <div className="absolute bottom-full left-0 right-0 h-10 bg-gradient-to-t from-gray-200/50 to-transparent pointer-events-none" />
                        <div className="bg-[#222b3c] rounded-t-3xl shadow-[0_-5px_25px_rgba(0,0,0,0.2)] p-5 text-white">
                            <div className="flex justify-between items-center gap-4">
                                <div onClick={() => setShowMobileSummary(!showMobileSummary)} className="flex flex-col cursor-pointer">
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-[#EAD8B1] uppercase tracking-widest mb-0.5">
                                        {t.has('sumTotal') ? t('sumTotal') : 'Total'} <ChevronUp size={12} className={`transition-transform text-white ${showMobileSummary ? 'rotate-180' : ''}`} />
                                    </div>
                                    <div className="text-3xl font-garamond font-bold leading-none text-white">${quote.total.toFixed(2)}</div>
                                </div>

                                <Link
                                    href={`/${locale}/registro-cliente`}
                                    className="bg-[#EAD8B1] text-[#222b3c] px-6 py-3.5 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-transform flex items-center gap-2"
                                >
                                    <UserPlus size={18} />
                                    {t.has('btnCreateAccount') ? t('btnCreateAccount') : 'Create Account'}
                                </Link>
                            </div>

                            {showMobileSummary && (
                                <div className="mt-5 pt-5 border-t border-gray-600 text-sm space-y-3">
                                    <div className="flex justify-between text-gray-300">
                                        <span>Service Base</span>
                                        <span>${quote.baseFare.toFixed(2)}</span>
                                    </div>
                                    {quote.distanceSurcharge > 0 && (
                                        <div className="flex justify-between text-blue-300">
                                            <span>Distance Surcharge</span>
                                            <span>+${quote.distanceSurcharge.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-gray-400 text-xs">
                                        <span>Processing Fee</span>
                                        <span>+${quote.processingFee.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 pt-3 border-t border-gray-600">
                                        <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">{vehicleInfo.icon}</div>
                                        <span className="text-xs text-gray-400">{vehicleInfo.title} · {vehicleInfo.dims}</span>
                                    </div>
                                    <div className="pt-3 border-t border-gray-600">
                                        <Link href={`/${locale}/login-cliente`} className="text-xs text-[#EAD8B1] font-bold flex items-center gap-1 hover:underline">
                                            {t.has('btnAlreadyAccount') ? t('btnAlreadyAccount') : 'Already have an account? Log in'}
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

     {/* EMPTY STATE */}
            {!serviceType && (
                <div className="max-w-2xl mx-auto px-4 py-16 text-center">
                    <button
                        type="button"
                        onClick={() => serviceSelectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                        className="w-full bg-white rounded-2xl p-10 shadow-sm border border-gray-100 hover:shadow-md hover:border-gmc-dorado-principal/40 active:scale-[0.98] transition-all cursor-pointer group"
                    >
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gmc-dorado-principal/10 transition-colors">
                            <ArrowRight size={24} className="text-gray-400 -rotate-90 group-hover:text-gmc-dorado-principal group-hover:-translate-y-1 transition-all" />
                        </div>
                        <p className="text-gray-500 font-medium">
                            {t.has('selectServicePrompt') ? t('selectServicePrompt') : 'Select a service above to get your quote'}
                        </p>
                    </button>
                </div>
            )}
        </div>
    );
}