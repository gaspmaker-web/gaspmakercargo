"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
    Truck, MapPin, Loader2, Package, Check,
    ChevronDown, ChevronUp, Weight, AlertTriangle,
    Car, Warehouse, Globe, ArrowRight, ShieldCheck, UserPlus, Ruler, Info
} from 'lucide-react';
import { useJsApiLoader } from '@react-google-maps/api';
import { getProcessingFee } from '@/lib/stripeCalc';
import { calculateAuraLocalDelivery, getVehicleByWeight, AuraBox } from '@/lib/aura-engine';

// 🔥 DnD-Kit con TouchSensor para móvil
import {
  KeyboardSensor, PointerSensor, TouchSensor,
  useSensor, useSensors, DragEndEvent
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';

// 🔥 RouteSection — arquitectura array único (Uber/Lyft style)
import RouteSection, { Stop, StopType } from '@/components/dashboard/RouteSection';

const GMC_WAREHOUSE_ADDRESS = "1861 NW 22nd St, Miami, FL 33142";
const GOOGLE_LIBRARIES: ("places")[] = ["places"];

const WEIGHT_OPTIONS = [
    { id: 'w_0_40',    label: '0 - 40 Lbs',                 estWeight: 40 },
    { id: 'w_41_50',   label: '41 - 50 Lbs',                estWeight: 50 },
    { id: 'w_51_60',   label: '51 - 60 Lbs',                estWeight: 60 },
    { id: 'w_61_70',   label: '61 - 70 Lbs',                estWeight: 70 },
    { id: 'w_71_80',   label: '71 - 80 Lbs',                estWeight: 80 },
    { id: 'w_81_90',   label: '81 - 90 Lbs',                estWeight: 90 },
    { id: 'w_91_100',  label: '91 - 100 Lbs',               estWeight: 100 },
    { id: 'w_101_110', label: '101 - 110 Lbs',              estWeight: 110 },
    { id: 'w_111_120', label: '111 - 120 Lbs',              estWeight: 120 },
    { id: 'w_121_130', label: '121 - 130 Lbs',              estWeight: 130 },
    { id: 'w_131_140', label: '131 - 140 Lbs',              estWeight: 140 },
    { id: 'w_141_150', label: '141 - 150 Lbs',              estWeight: 150 },
    { id: 'w_151_plus', label: '151+ Lbs (Pallet / Heavy)', estWeight: 0 },
];

export default function PublicQuotePage() {
    const t = useTranslations('Pickup');
    const locale = useLocale();

    const VEHICLE_DISPLAY: Record<string, { icon: React.ReactNode; title: string; desc: string; dims: string }> = {
        CAR_SUV:   { icon: <Car size={22} className="text-blue-600" />,      title: t('volLow'),  desc: t.has('carSuvDesc') ? t('carSuvDesc') : 'Small boxes, documents (0-50 lbs)',          dims: t.has('carSuvDims') ? t('carSuvDims') : 'Max. 4 ft long' },
        MINIVAN:   { icon: <Truck size={22} className="text-green-600" />,   title: t('volMed'),  desc: t.has('minivanDesc') ? t('minivanDesc') : 'Small furniture, medium boxes (51-150 lbs)', dims: t.has('minivanDims') ? t('minivanDims') : 'Max. 7 ft long · 4 ft tall' },
        CARGO_VAN: { icon: <Warehouse size={22} className="text-orange-600" />, title: t('volHigh'), desc: t.has('cargoVanDesc') ? t('cargoVanDesc') : '1-2 pallets, heavy cargo (151-800 lbs)',  dims: t.has('cargoVanDims') ? t('cargoVanDims') : 'Max. 12 ft long · 6 ft tall' },
        BOX_TRUCK: { icon: <Package size={22} className="text-red-600" />,   title: t('volFull'), desc: t.has('boxTruckDesc') ? t('boxTruckDesc') : '2+ pallets, oversized (800+ lbs)',          dims: t.has('boxTruckDims') ? t('boxTruckDims') : 'Max. 20 ft long · 8 ft tall' },
    };

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "",
        libraries: GOOGLE_LIBRARIES
    });

    const [serviceType, setServiceType] = useState<string | null>(null);
    const [showMobileSummary, setShowMobileSummary] = useState(false);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    const formSectionRef = useRef<HTMLDivElement>(null);
    const serviceSelectorRef = useRef<HTMLDivElement>(null);
    const stopsRef = useRef<Stop[]>([]);

    const [quote, setQuote] = useState({
        total: 0, subtotal: 0, processingFee: 0,
        baseFare: 0, distanceSurcharge: 0, distanceMiles: 0
    });

    const [formData, setFormData] = useState({
        weightTier: 'w_0_40', exactWeight: 0,
        heavyVehicle: 'CARGO_VAN', palletCount: 1
    });

    // ─── ARQUITECTURA UBER/LYFT: UN SOLO ARRAY ─────────────────────────
    const makeStop = (type: StopType, id?: string): Stop => ({
        id: id ?? `stop-${Date.now()}-${Math.random()}`,
        type, address: '', description: '', error: undefined,
    });

    const [stops, setStops] = useState<Stop[]>([
        makeStop('PICKUP', 'pickup'),
        makeStop('DROPOFF', 'dropoff'),
    ]);

    useEffect(() => { stopsRef.current = stops; }, [stops]);

    // ─── DnD Sensors ───────────────────────────────────────────────────
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor,   { activationConstraint: { delay: 250, tolerance: 10 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // ─── Keyboard detection (hide bottom bar) ──────────────────────────
    useEffect(() => {
        const show = () => setIsKeyboardOpen(true);
        const hide = () => setTimeout(() => setIsKeyboardOpen(false), 100);
        document.addEventListener('focusin', show);
        document.addEventListener('focusout', hide);
        return () => { document.removeEventListener('focusin', show); document.removeEventListener('focusout', hide); };
    }, []);

    // ─── Derived values ─────────────────────────────────────────────────
    const originAddress  = stops[0]?.address ?? '';
    const dropOffAddress = stops[stops.length - 1]?.address ?? '';

    // ─── Stop handlers ──────────────────────────────────────────────────
    const handleStopAddressValid = (id: string, address: string) =>
        setStops(prev => prev.map(s => s.id === id ? { ...s, address, error: undefined } : s));

    const handleStopAddressError = (id: string, error: string) =>
        setStops(prev => prev.map(s => s.id === id ? { ...s, address: '', error } : s));

    const handleStopAddressClear = (id: string) => {
        setStops(prev => prev.map(s => s.id === id ? { ...s, address: '', error: undefined } : s));
        setQuote(q => ({ ...q, distanceMiles: 0, distanceSurcharge: 0 }));
    };

    const handleStopDescriptionChange = (id: string, description: string) =>
        setStops(prev => prev.map(s => s.id === id ? { ...s, description } : s));

    const handleAddStop = () => {
        setStops(prev => {
            const newStop = makeStop('STOP');
            if (serviceType === 'SHIPPING') return [...prev, newStop];
            const withoutLast = prev.slice(0, -1);
            return [...withoutLast, newStop, prev[prev.length - 1]];
        });
    };

    const handleRemoveStop = (id: string) => {
        setStops(prev => prev.filter(s => s.id !== id));
        setQuote(q => ({ ...q, distanceMiles: 0, distanceSurcharge: 0 }));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        setStops(prev => {
            const reordered = arrayMove(prev,
                prev.findIndex(s => s.id === active.id),
                prev.findIndex(s => s.id === over.id)
            );
            stopsRef.current = reordered;
            calculateComplexRoute(
                reordered[0]?.address ?? '',
                reordered[reordered.length - 1]?.address ?? '',
                reordered
            );
            return reordered;
        });
    };

    // ─── Computed ───────────────────────────────────────────────────────
    const calcWeight = useMemo(() => {
        if (formData.weightTier === 'w_151_plus') return formData.exactWeight > 0 ? formData.exactWeight : 151;
        return WEIGHT_OPTIONS.find(w => w.id === formData.weightTier)?.estWeight || 40;
    }, [formData.weightTier, formData.exactWeight]);

    const autoVehicle = useMemo(() => {
        if (formData.weightTier === 'w_151_plus') {
            return formData.heavyVehicle === 'BOX_TRUCK'
                ? { type: 'BOX_TRUCK', rate: 2.50, maxLength: '20 ft', maxHeight: '8 ft' }
                : { type: 'CARGO_VAN', rate: 1.75, maxLength: '12 ft', maxHeight: '6 ft' };
        }
        return getVehicleByWeight(calcWeight);
    }, [calcWeight, formData.weightTier, formData.heavyVehicle]);

    const vehicleInfo = VEHICLE_DISPLAY[autoVehicle.type] || VEHICLE_DISPLAY.CAR_SUV;
    const isPalletMode = formData.weightTier === 'w_151_plus';

    // ─── Quote calculation ──────────────────────────────────────────────
    useEffect(() => {
        if (!isLoaded || !serviceType) return;
        const box: AuraBox = { length: 10, width: 10, height: 10, realWeight: calcWeight };
        let baseFare = calculateAuraLocalDelivery([box], quote.distanceMiles).baseFare;
        if (isPalletMode) {
            baseFare = formData.heavyVehicle === 'BOX_TRUCK' ? 175
                : formData.palletCount === 2 ? 125 : 95;
        }
        let distanceSurcharge = 0;
        if (quote.distanceMiles > 10) {
            distanceSurcharge = parseFloat(((quote.distanceMiles - 10) * autoVehicle.rate).toFixed(2));
        }
        const subtotal = baseFare + distanceSurcharge;
        const processingFee = subtotal > 0 ? getProcessingFee(subtotal) : 0;
        setQuote(prev => ({ ...prev, baseFare, distanceSurcharge, subtotal, processingFee, total: subtotal + processingFee }));
    }, [calcWeight, quote.distanceMiles, isLoaded, serviceType, autoVehicle.rate, formData.palletCount, formData.heavyVehicle, isPalletMode]);

    // ─── Distance recalc ────────────────────────────────────────────────
    useEffect(() => {
        if (!isLoaded || !serviceType) return;
        if (originAddress) calculateComplexRoute(originAddress, dropOffAddress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stops, serviceType, isLoaded, autoVehicle.type]);

    const calculateComplexRoute = async (origin: string, destination: string, currentStops?: Stop[]) => {
        if (!isLoaded || typeof google === 'undefined' || !origin) return;
        try {
            const svc = new google.maps.DistanceMatrixService();
            const getLeg = async (a: string, b: string) => {
                if (!a || !b) return 0;
                const res = await svc.getDistanceMatrix({
                    origins: [a], destinations: [b],
                    travelMode: google.maps.TravelMode.DRIVING,
                    unitSystem: google.maps.UnitSystem.IMPERIAL
                });
                const el = res.rows[0].elements[0];
                if (el.status !== 'OK') return 0;
                return el.distance.text.includes('mi')
                    ? parseFloat(el.distance.text.replace(' mi', '').replace(',', ''))
                    : el.distance.value / 1609.34;
            };

            const allStops = currentStops ?? stopsRef.current;
            const validAddresses = allStops.filter(s => s.address).map(s => s.address);
            if (validAddresses.length < 1) return;

            let total = 0;
            if (serviceType === 'SHIPPING') {
                total += await getLeg(GMC_WAREHOUSE_ADDRESS, validAddresses[0]);
                for (let i = 0; i < validAddresses.length - 1; i++)
                    total += await getLeg(validAddresses[i], validAddresses[i + 1]);
                if (autoVehicle.type === 'BOX_TRUCK')
                    total += await getLeg(validAddresses[validAddresses.length - 1], GMC_WAREHOUSE_ADDRESS);
            } else if (serviceType === 'DELIVERY') {
                if (validAddresses.length < 2) return;
                total += await getLeg(GMC_WAREHOUSE_ADDRESS, validAddresses[0]);
                for (let i = 0; i < validAddresses.length - 1; i++)
                    total += await getLeg(validAddresses[i], validAddresses[i + 1]);
                if (autoVehicle.type === 'BOX_TRUCK')
                    total += await getLeg(validAddresses[validAddresses.length - 1], GMC_WAREHOUSE_ADDRESS);
            }
            setQuote(prev => ({ ...prev, distanceMiles: parseFloat(total.toFixed(1)) }));
        } catch (e) { console.error('Route error:', e); }
    };

    // ─── Service select ──────────────────────────────────────────────────
    const handleServiceSelect = (type: string) => {
        setServiceType(type);
        setQuote(prev => ({ ...prev, distanceMiles: 0, distanceSurcharge: 0 }));
        if (type === 'SHIPPING') {
            setStops([makeStop('PICKUP', 'pickup')]);
        } else {
            setStops([makeStop('PICKUP', 'pickup'), makeStop('DROPOFF', 'dropoff')]);
        }
        setTimeout(() => formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    };

    if (!isLoaded) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-gmc-dorado-principal" size={32} />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 font-montserrat overflow-x-hidden">

            {/* HERO */}
            <div className="relative bg-[#1a1f2e] text-white pt-24 pb-32 px-4 text-center overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gmc-dorado-principal/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] -ml-40 -mb-20 pointer-events-none" />
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
                        <Globe size={12} className="text-gmc-dorado-principal" />
                        <span className="text-xs font-bold tracking-wider text-gray-200 uppercase">Gasp Maker Cargo</span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <button onClick={() => handleServiceSelect('SHIPPING')}
                        className={`p-8 rounded-2xl border-2 transition-all duration-300 text-left group hover:-translate-y-1 hover:shadow-xl ${serviceType === 'SHIPPING' ? 'border-blue-500 bg-blue-50 shadow-lg' : 'border-gray-200 bg-white shadow-md'}`}>
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

                    <button onClick={() => handleServiceSelect('DELIVERY')}
                        className={`p-8 rounded-2xl border-2 transition-all duration-300 text-left group hover:-translate-y-1 hover:shadow-xl ${serviceType === 'DELIVERY' ? 'border-green-500 bg-green-50 shadow-lg' : 'border-gray-200 bg-white shadow-md'}`}>
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
                <div ref={formSectionRef} className="max-w-5xl mx-auto px-4 pb-32 animate-fadeIn scroll-mt-24">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* LEFT: FORM */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* ✅ RouteSection — array único, todo draggable */}
                            <RouteSection
                                serviceType={serviceType as 'SHIPPING' | 'DELIVERY'}
                                stops={stops}
                                distanceMiles={quote.distanceMiles}
                                onStopAddressValid={handleStopAddressValid}
                                onStopAddressError={handleStopAddressError}
                                onStopAddressClear={handleStopAddressClear}
                                onStopDescriptionChange={handleStopDescriptionChange}
                                onAddStop={handleAddStop}
                                onRemoveStop={handleRemoveStop}
                                onDragEnd={handleDragEnd}
                                sensors={sensors}
                                t_routeTitle={t.has('routeTitle') ? t('routeTitle') : 'Route'}
                                t_pickupPointA={t.has('pickupPointA') ? t('pickupPointA') : 'Pickup (A)'}
                                t_dropoffLabel={t.has('dropoffPointB') ? t('dropoffPointB') : 'Dropoff'}
                                t_interDestTitle={t.has('interDestTitle') ? t('interDestTitle') : 'Intermediate Destination'}
                                t_gmcWarehouse={t.has('gmcWarehouse') ? t('gmcWarehouse') : 'GMC Warehouse (Miami)'}
                                t_exportNote={t.has('exportNote') ? t('exportNote') : 'From here it will be exported to your country.'}
                                t_pickupDescPlaceholder={t.has('pickupDescPlaceholder') ? t('pickupDescPlaceholder') : 'What are you picking up here?'}
                                t_dropoffDescPlaceholder={t.has('dropoffDescPlaceholder') ? t('dropoffDescPlaceholder') : 'What are you delivering here?'}
                                t_addStop={t.has('addStop') ? t('addStop') : 'Add Stop'}
                                t_countyError={t.has('countyError') ? t('countyError') : '❌ Miami-Dade & Broward only.'}
                                t_pickupAddress={t.has('pickupAddressPlaceholder') ? t('pickupAddressPlaceholder') : 'Pickup address...'}
                                t_dropoffAddress={t.has('dropoffAddressPlaceholder') ? t('dropoffAddressPlaceholder') : 'Delivery address...'}
                                t_estimatedRoute={t.has('estimatedRoute') ? t('estimatedRoute') : 'estimated route'}
                            />

                            {/* LOAD DETAILS */}
                            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="font-bold text-gmc-gris-oscuro text-sm uppercase mb-4">
                                    {t.has('loadDetailsTitle') ? t('loadDetailsTitle') : 'Load Details'}
                                </h3>

                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t('weightQuestion')}</label>
                                    <div className="relative">
                                        <select
                                            className="w-full p-3 pl-4 border border-gray-200 rounded-xl bg-white appearance-none font-medium focus:ring-2 focus:ring-gmc-dorado-principal focus:border-transparent"
                                            style={{ fontSize: '16px' }}
                                            onChange={e => setFormData({ ...formData, weightTier: e.target.value, exactWeight: 0 })}
                                            value={formData.weightTier}
                                        >
                                            {WEIGHT_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                    </div>
                                </div>

                                {isPalletMode && (
                                    <div className="space-y-4 mb-4">
                                        <div className="relative">
                                            <Weight className="absolute left-3 top-1/2 -translate-y-1/2 text-gmc-dorado-principal" size={18} />
                                            <input type="number" placeholder={t('exactWeightPlaceholder')}
                                                style={{ fontSize: '16px' }}
                                                className="w-full p-3 pl-10 border border-yellow-200 rounded-xl bg-yellow-50 font-bold placeholder-yellow-600/50 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                                onChange={e => setFormData({ ...formData, exactWeight: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase">{t('selectVehicleLabel')}</label>
                                        <div className="space-y-3">
                                            {(['CARGO_VAN', 'BOX_TRUCK'] as const).map(vt => {
                                                const vi = VEHICLE_DISPLAY[vt];
                                                const isActive = formData.heavyVehicle === vt;
                                                return (
                                                    <div key={vt} onClick={() => setFormData({ ...formData, heavyVehicle: vt, palletCount: vt === 'CARGO_VAN' ? 1 : 3 })}
                                                        className={`relative flex items-center p-4 rounded-2xl cursor-pointer border-2 transition-all ${isActive ? 'border-gmc-dorado-principal bg-yellow-50/30 shadow-md' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                                                        {isActive && (
                                                            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center shadow-sm z-10">
                                                                <Check size={14} strokeWidth={3} />
                                                            </div>
                                                        )}
                                                        <div className={`w-12 h-10 rounded-xl flex items-center justify-center mr-4 shrink-0 ${vt === 'CARGO_VAN' ? 'bg-orange-50 border border-orange-100' : 'bg-red-50 border border-red-100'}`}>
                                                            {vi.icon}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-bold text-gray-800 text-sm">{vi.title}</p>
                                                            <p className="text-xs text-gray-500 mt-0.5">{vi.desc}</p>
                                                            <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><Ruler size={10} /> {vi.dims}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-3">{t('howManyPallets')}</label>
                                            <div className="flex gap-2">
                                                {(formData.heavyVehicle === 'CARGO_VAN' ? [1, 2] : [3, 4, 5, 6]).map(n => (
                                                    <button key={n} type="button"
                                                        onClick={() => setFormData({ ...formData, palletCount: n })}
                                                        className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all ${formData.palletCount === n ? 'bg-gmc-dorado-principal text-black shadow-md scale-105' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                                                        {n}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-[11px] text-gray-500 mt-2 text-center">
                                                {formData.heavyVehicle === 'CARGO_VAN'
                                                    ? <><strong>${formData.palletCount === 2 ? '125.00' : '95.00'}</strong> ({formData.palletCount} pallet{formData.palletCount > 1 ? 's' : ''})</>
                                                    : <><strong>$175.00</strong> ({formData.palletCount} pallets — flat rate)</>}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {!isPalletMode && (
                                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">{vehicleInfo.icon}</div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{t.has('vehicleLabel') ? t('vehicleLabel') : 'Vehicle:'} {vehicleInfo.title}</p>
                                                <p className="text-[10px] text-gray-500">{vehicleInfo.desc}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-100 w-fit mb-3">
                                            <Ruler size={12} className="text-gmc-dorado-principal" />
                                            <span className="font-medium">{vehicleInfo.dims}</span>
                                        </div>
                                        <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2">
                                            <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
                                            <p className="text-[11px] text-amber-800 leading-snug">
                                                Does your longest item exceed <strong>{autoVehicle.maxLength}</strong>? If so, consider selecting a higher weight range.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT: SUMMARY DESKTOP */}
                        <div className="hidden lg:block lg:col-span-1">
                            <div className="bg-gmc-gris-oscuro text-white p-6 rounded-2xl shadow-xl sticky top-6">
                                <h3 className="font-bold text-gmc-dorado-principal text-lg mb-4 border-b border-gray-600 pb-2">
                                    {t.has('summaryTitle') ? t('summaryTitle') : 'Quote Summary'}
                                </h3>
                                <div className="space-y-3 text-sm mb-4">
                                    <div className="flex justify-between"><span>{t.has('sumService') ? t('sumService') : 'Service'}</span><span className="font-mono font-bold">${quote.baseFare.toFixed(2)}</span></div>
                                    {quote.distanceSurcharge > 0 && (
                                        <div className="flex justify-between"><span>{t.has('sumDistance') ? t('sumDistance') : 'Distance'}</span><span>+${quote.distanceSurcharge.toFixed(2)}</span></div>
                                    )}
                                    <div className="flex justify-between text-gray-400 text-xs"><span>Processing Fee</span><span>+${quote.processingFee.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-600 text-gmc-dorado-principal">
                                        <span>{t.has('sumTotal') ? t('sumTotal') : 'Total'}</span><span>${quote.total.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-gray-700/50 rounded-xl border border-gray-600 mb-4">
                                    <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">{vehicleInfo.icon}</div>
                                    <div><p className="text-xs font-bold text-white">{vehicleInfo.title}</p><p className="text-[10px] text-gray-400">{vehicleInfo.dims}</p></div>
                                </div>
                                <div className="space-y-3">
                                    <Link href={`/${locale}/registro-cliente`}
                                        className="w-full py-3 bg-gmc-dorado-principal text-gmc-gris-oscuro font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-white transition-colors">
                                        <UserPlus size={18} />{t.has('btnCreateAccount') ? t('btnCreateAccount') : 'Create Account to Book'}
                                    </Link>
                                    <Link href={`/${locale}/login-cliente`}
                                        className="w-full py-2.5 bg-transparent text-gray-400 font-bold rounded-xl flex justify-center items-center gap-2 hover:text-white transition-colors text-sm border border-gray-600 hover:border-gray-400">
                                        {t.has('btnAlreadyAccount') ? t('btnAlreadyAccount') : 'Already have an account? Log in'}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MOBILE BOTTOM BAR */}
                    {!isKeyboardOpen && (
                        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
                            <div className="absolute bottom-full left-0 right-0 h-10 bg-gradient-to-t from-gray-200/50 to-transparent pointer-events-none" />
                            <div className="bg-[#222b3c] rounded-t-3xl shadow-[0_-5px_25px_rgba(0,0,0,0.2)] p-5 text-white">
                                <div className="flex justify-between items-center gap-4">
                                    <div onClick={() => setShowMobileSummary(!showMobileSummary)} className="flex flex-col cursor-pointer">
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-[#EAD8B1] uppercase tracking-widest mb-0.5">
                                            {t.has('sumTotal') ? t('sumTotal') : 'Total'} <ChevronUp size={12} className={`transition-transform text-white ${showMobileSummary ? 'rotate-180' : ''}`} />
                                        </div>
                                        <div className="text-3xl font-garamond font-bold leading-none">${quote.total.toFixed(2)}</div>
                                    </div>
                                    <Link href={`/${locale}/registro-cliente`}
                                        className="bg-[#EAD8B1] text-[#222b3c] px-6 py-3.5 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-transform flex items-center gap-2">
                                        <UserPlus size={18} />{t.has('btnCreateAccount') ? t('btnCreateAccount') : 'Create Account'}
                                    </Link>
                                </div>
                                {showMobileSummary && (
                                    <div className="mt-5 pt-5 border-t border-gray-600 text-sm space-y-3">
                                        <div className="flex justify-between text-gray-300"><span>Service Base</span><span>${quote.baseFare.toFixed(2)}</span></div>
                                        {quote.distanceSurcharge > 0 && (
                                            <div className="flex justify-between text-blue-300"><span>Distance</span><span>+${quote.distanceSurcharge.toFixed(2)}</span></div>
                                        )}
                                        <div className="flex justify-between text-gray-400 text-xs"><span>Processing Fee</span><span>+${quote.processingFee.toFixed(2)}</span></div>
                                        <div className="flex items-center gap-2 pt-3 border-t border-gray-600">
                                            <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">{vehicleInfo.icon}</div>
                                            <span className="text-xs text-gray-400">{vehicleInfo.title} · {vehicleInfo.dims}</span>
                                        </div>
                                        <div className="pt-3 border-t border-gray-600">
                                            <Link href={`/${locale}/login-cliente`} className="text-xs text-[#EAD8B1] font-bold hover:underline">
                                                {t.has('btnAlreadyAccount') ? t('btnAlreadyAccount') : 'Already have an account? Log in'}
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* EMPTY STATE */}
            {!serviceType && (
                <div className="max-w-2xl mx-auto px-4 py-16 text-center">
                    <button type="button"
                        onClick={() => serviceSelectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                        className="w-full bg-white rounded-2xl p-10 shadow-sm border border-gray-100 hover:shadow-md hover:border-gmc-dorado-principal/40 active:scale-[0.98] transition-all cursor-pointer group">
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