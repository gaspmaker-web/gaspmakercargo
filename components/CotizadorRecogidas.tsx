"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { Calculator, Truck, MapPin, Package, AlertTriangle, CheckCircle, Info } from "lucide-react";

// --- CONFIGURACIÓN DE TARIFAS ---

const WEIGHT_TIERS = [
  { id: 'w_30', label: '8 oz - 40 lbs (Pequeño)', price: 30 },
  { id: 'w_45', label: '41 lbs - 70 lbs (Mediano)', price: 45 },
  { id: 'w_65', label: '71 lbs - 110 lbs (Grande)', price: 65 },
  { id: 'w_85', label: '111 lbs - 150 lbs (Muy Grande)', price: 85 },
  { id: 'w_heavy', label: 'Más de 151 lbs (Carga Pesada)', price: 0 }, // Precio calculado: $0.55 * lbs
];

const VOLUME_TIERS = [
  { id: 'v_30', label: 'Estándar (Hasta 1/4 área)', price: 30 },
  { id: 'v_55', label: 'Medio Volumen (1/4 a 1/2 área)', price: 55 },
  { id: 'v_75', label: 'Alto Volumen (1/2 a 3/4 área)', price: 75 },
  { id: 'v_100', label: 'Uso Exclusivo / Flete (Toda el área)', price: 100 },
];

const BASE_MILES = 10;
const MILE_SURCHARGE = 1.50;
const HEAVY_RATE_PER_LB = 0.55;

// --- TYPES ---
interface FormData {
  weightTier: string;
  exactWeight?: number; // Solo si es heavy
  volumeTier: string;
  originAddress: string;
  destAddress: string;
  distanceMiles: number;
  contactName: string;
  contactPhone: string;
  description: string;
  termsAccepted: boolean;
}

const GOOGLE_LIBRARIES: ("places")[] = ["places"];

export default function CotizadorRecogidas() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "",
    libraries: GOOGLE_LIBRARIES
  });

  if (!isLoaded) return <div className="p-10 text-center animate-pulse">Cargando Mapas...</div>;

  return <CotizadorForm />;
}

function CotizadorForm() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [quoteResult, setQuoteResult] = useState<{
    baseFare: number;
    distanceSurcharge: number;
    total: number;
    appliedStrategy: 'WEIGHT' | 'VOLUME';
  } | null>(null);

  // Refs de Google Maps
  const originRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      weightTier: 'w_30',
      volumeTier: 'v_30',
      distanceMiles: 0,
      termsAccepted: false
    }
  });

  // Observamos valores para recálculo en tiempo real
  const watchedValues = watch();

  // --- LÓGICA DE CÁLCULO (TU ESTRATEGIA) ---
  useEffect(() => {
    const calculateTotal = () => {
      const { weightTier, exactWeight, volumeTier, distanceMiles } = watchedValues;

      // 1. Calcular Tarifa por Peso (TP)
      let tp = 0;
      if (weightTier === 'w_heavy') {
        tp = (exactWeight || 151) * HEAVY_RATE_PER_LB;
      } else {
        const tier = WEIGHT_TIERS.find(t => t.id === weightTier);
        tp = tier ? tier.price : 0;
      }

      // 2. Calcular Tarifa por Volumen (TV)
      const vTier = VOLUME_TIERS.find(v => v.id === volumeTier);
      const tv = vTier ? vTier.price : 0;

      // 3. Determinar Base Máxima
      const baseFare = Math.max(tp, tv);
      const appliedStrategy = tp > tv ? 'WEIGHT' : 'VOLUME';

      // 4. Recargo por Distancia (RD)
      let rd = 0;
      if (distanceMiles > BASE_MILES) {
        rd = (distanceMiles - BASE_MILES) * MILE_SURCHARGE;
      }

      // 5. Total
      setQuoteResult({
        baseFare,
        distanceSurcharge: rd,
        total: baseFare + rd,
        appliedStrategy
      });
    };

    calculateTotal();
  }, [
    watchedValues.weightTier, 
    watchedValues.exactWeight, 
    watchedValues.volumeTier, 
    watchedValues.distanceMiles
  ]);

  // --- GOOGLE MAPS DISTANCE ---
  const calculateDistance = async () => {
    const origin = watchedValues.originAddress;
    const dest = watchedValues.destAddress;

    if (!origin || !dest) return;

    setIsCalculating(true);
    try {
        const service = new google.maps.DistanceMatrixService();
        const result = await service.getDistanceMatrix({
            origins: [origin],
            destinations: [dest],
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.IMPERIAL
        });

        const element = result.rows[0].elements[0];
        if (element.status === "OK") {
            // Convertir metros a millas (1 mi = 1609.34 m)
            const miles = element.distance.value / 1609.34;
            setValue("distanceMiles", parseFloat(miles.toFixed(1)));
        }
    } catch (e) {
        console.error("Error calculando distancia", e);
    } finally {
        setIsCalculating(false);
    }
  };

  const onSubmit = (data: FormData) => {
    if (!quoteResult) return;
    
    // Aquí conectas con tu API para guardar la orden
    alert(`Orden generada! Total a cobrar: $${quoteResult.total.toFixed(2)}`);
    console.log("Datos para Backend:", { ...data, quote: quoteResult });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-gray-100">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
        <div className="bg-gmc-gris-oscuro p-3 rounded-xl text-gmc-dorado-principal shadow-lg">
            <Calculator size={32} />
        </div>
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gmc-gris-oscuro font-garamond">
                Cotizador de Delivery
            </h1>
            <p className="text-gray-500 text-sm">Logística local Punto A &rarr; Punto B</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: INPUTS */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* 1. SELECCIÓN DE CARGA */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <h3 className="font-bold text-gmc-gris-oscuro mb-4 flex items-center gap-2">
                    <Package size={18}/> Características de la Carga
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Peso */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Peso Estimado</label>
                        <select 
                            {...register("weightTier")}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gmc-dorado-principal outline-none bg-white"
                        >
                            {WEIGHT_TIERS.map(t => (
                                <option key={t.id} value={t.id}>{t.label} - ${t.price > 0 ? t.price : 'Calc'}</option>
                            ))}
                        </select>
                    </div>

                    {/* Volumen */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Volumen / Espacio</label>
                        <select 
                            {...register("volumeTier")}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gmc-dorado-principal outline-none bg-white"
                        >
                            {VOLUME_TIERS.map(t => (
                                <option key={t.id} value={t.id}>{t.label} - ${t.price}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Input Condicional para Carga Pesada */}
                {watchedValues.weightTier === 'w_heavy' && (
                    <div className="mt-4 animate-fadeIn">
                        <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Peso Exacto (Lbs)</label>
                        <input 
                            type="number" 
                            {...register("exactWeight", { required: true, min: 151 })}
                            placeholder="Ej: 200"
                            className="w-full p-3 border-2 border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <p className="text-xs text-blue-500 mt-1">* Se cobrará $0.55 por libra.</p>
                    </div>
                )}
            </div>

            {/* 2. RUTA (GOOGLE MAPS) */}
            <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                    <Truck size={18}/> Ruta de Entrega
                </h3>

                <div className="space-y-4">
                    {/* Punto A */}
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3.5 text-green-600 z-10" size={18}/>
                        <Autocomplete
                            onLoad={ref => { originRef.current = ref }}
                            onPlaceChanged={() => {
                                const place = originRef.current?.getPlace();
                                if(place?.formatted_address) {
                                    setValue("originAddress", place.formatted_address);
                                    calculateDistance();
                                }
                            }}
                        >
                            <input 
                                type="text" 
                                placeholder="Punto A: Dirección de Recogida"
                                className="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                {...register("originAddress", { required: true })}
                            />
                        </Autocomplete>
                    </div>

                    {/* Punto B */}
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3.5 text-red-600 z-10" size={18}/>
                        <Autocomplete
                            onLoad={ref => { destRef.current = ref }}
                            onPlaceChanged={() => {
                                const place = destRef.current?.getPlace();
                                if(place?.formatted_address) {
                                    setValue("destAddress", place.formatted_address);
                                    calculateDistance();
                                }
                            }}
                        >
                            <input 
                                type="text" 
                                placeholder="Punto B: Dirección de Entrega"
                                className="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                {...register("destAddress", { required: true })}
                            />
                        </Autocomplete>
                    </div>

                    {/* Distancia Calculada */}
                    <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-blue-200">
                        <span className="text-sm font-bold text-gray-600">Distancia Estimada:</span>
                        <div className="text-right">
                             {isCalculating ? (
                                <span className="text-sm text-blue-500 animate-pulse">Calculando...</span>
                             ) : (
                                <span className="text-lg font-bold text-blue-800">{watchedValues.distanceMiles} Millas</span>
                             )}
                        </div>
                    </div>
                    {watchedValues.distanceMiles > 10 && (
                        <p className="text-xs text-orange-600 flex items-center gap-1">
                            <Info size={12}/> Aplica recargo por distancia ({watchedValues.distanceMiles - 10} mi extra)
                        </p>
                    )}
                </div>
            </div>

            {/* 3. CONTACTO Y DESCRIPCIÓN */}
            <div className="grid grid-cols-2 gap-4">
                <input {...register("contactName", {required: true})} placeholder="Nombre de Contacto" className="p-3 border rounded-lg" />
                <input {...register("contactPhone", {required: true})} placeholder="Teléfono" type="tel" className="p-3 border rounded-lg" />
            </div>
            <textarea {...register("description", {required: true})} placeholder="Detalles adicionales (instrucciones de puerta, código de acceso...)" className="w-full p-3 border rounded-lg h-24"></textarea>

        </div>

        {/* COLUMNA DERECHA: RESUMEN DE COSTOS */}
        <div className="lg:col-span-1">
            <div className="bg-gmc-gris-oscuro text-white p-6 rounded-2xl shadow-2xl sticky top-6">
                <h3 className="text-lg font-bold text-gmc-dorado-principal mb-4 border-b border-gray-600 pb-2">
                    Resumen de Cotización
                </h3>

                <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Tarifa Base ({quoteResult?.appliedStrategy === 'WEIGHT' ? 'Peso' : 'Volumen'}):</span>
                        <span className="font-bold">${quoteResult?.baseFare.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Recargo Distancia:</span>
                        <span className="font-bold text-orange-300">+${quoteResult?.distanceSurcharge.toFixed(2)}</span>
                    </div>

                    <div className="border-t border-gray-600 my-2 pt-2 flex justify-between items-end">
                        <span className="text-lg font-bold">TOTAL</span>
                        <span className="text-3xl font-bold text-gmc-dorado-principal">
                            ${quoteResult?.total.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* CLÁUSULA DE ACEPTACIÓN */}
                <div className="bg-white/10 p-3 rounded-lg mb-6">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="mt-1 w-5 h-5 text-gmc-dorado-principal rounded focus:ring-0"
                            {...register("termsAccepted", { required: true })}
                        />
                        <span className="text-xs text-gray-300 leading-snug">
                            Acepto que la tarifa se basa en mi estimación. Si el conductor detecta discrepancias en peso/tamaño al recoger, acepto pagar el recargo correspondiente.
                        </span>
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={!watchedValues.termsAccepted}
                    className="w-full py-4 bg-gmc-dorado-principal text-gmc-gris-oscuro font-bold rounded-xl hover:bg-white hover:text-black transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Solicitar Delivery
                </button>
            </div>
        </div>

      </form>
    </div>
  );
}