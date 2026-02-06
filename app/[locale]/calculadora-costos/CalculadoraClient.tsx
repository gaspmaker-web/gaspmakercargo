"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { 
    Calculator, Package, Smartphone, Laptop, 
    Footprints, Shirt, SprayCan, Box, Info, X, Check, Truck, Loader2, AlertCircle 
} from 'lucide-react';

// --- HELPER: Limpiar nombres de Carriers (Ej: UPSDAP -> UPS) ---
const cleanCarrierName = (name: string) => {
    if (!name) return '';
    const n = name.toUpperCase();
    if (n.includes('UPS')) return 'UPS';
    if (n.includes('FEDEX')) return 'FedEx';
    if (n.includes('DHL')) return 'DHL';
    if (n.includes('USPS')) return 'USPS';
    if (n.includes('GMC') || n.includes('GASP')) return 'Gasp Maker Cargo';
    return name; // Si no coincide con ninguno, devuelve el original
};

// --- DATA: Lista de países ---
const ALL_COUNTRIES = [
    { name: "Anguilla", code: "AI" }, { name: "Antigua and Barbuda", code: "AG" }, { name: "Aruba", code: "AW" },
    { name: "Bahamas", code: "BS" }, { name: "Barbados", code: "BB" }, { name: "Bermuda", code: "BM" },
    { name: "British Virgin Islands", code: "VG" }, { name: "Cayman Islands", code: "KY" },
    { name: "Dominican Republic", code: "DO" }, { name: "Grenada", code: "GD" },
    { name: "Jamaica", code: "JM" }, { name: "Mexico", code: "MX" }, 
    { name: "Puerto Rico", code: "PR" }, { name: "Trinidad and Tobago", code: "TT" },
    // { name: "United States", code: "US" }, // 🇺🇸 ELIMINADO POR LÓGICA DE NEGOCIO
    { name: "Colombia", code: "CO" },
    { name: "Spain", code: "ES" }, { name: "Canada", code: "CA" }, { name: "Venezuela", code: "VE" },
    { name: "Panama", code: "PA" }, { name: "Saint Thomas (USVI)", code: "VI" }
];

export default function CalculadoraClient() { 
    const t = useTranslations('CalculatorPage'); 
    const router = useRouter(); 

    // Estados de entrada
    const [length, setLength] = useState<number | ''>('');
    const [width, setWidth] = useState<number | ''>('');
    const [height, setHeight] = useState<number | ''>('');
    const [weight, setWeight] = useState<number | ''>('');
    const [value, setValue] = useState<number | ''>('');
    
    const [dimUnit, setDimUnit] = useState('cm'); 
    const [weightUnit, setWeightUnit] = useState('kg'); 
    const [country, setCountry] = useState('DO'); 
    const [activePreset, setActivePreset] = useState('other'); 

    // Estados de resultados
    const [apiRates, setApiRates] = useState<any[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    
    const sortedCountries = useMemo(() => {
        return [...ALL_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));
    }, []);
    
    // Definición de presets 
    const presets = {
        phone: { l: 20, w: 10, h: 5, wg: 0.5, val: 500, Icon: Smartphone, label: t('catPhone') },
        laptop: { l: 40, w: 30, h: 5, wg: 2.5, val: 1200, Icon: Laptop, label: t('catLaptop') },
        shoes: { l: 35, w: 25, h: 15, wg: 1.5, val: 100, Icon: Footprints, label: t('catShoes') },
        clothes: { l: 50, w: 40, h: 10, wg: 2, val: 80, Icon: Shirt, label: t('catClothes') },
        beauty: { l: 25, w: 20, h: 15, wg: 1, val: 60, Icon: SprayCan, label: t('catBeauty') },
        other: { l: '', w: '', h: '', wg: '', val: '', Icon: Box, label: t('catOther') }
    };

    const handlePresetClick = (presetKey: string) => {
        // @ts-ignore 
        const presetData = presets[presetKey];
        if (!presetData) return;

        setActivePreset(presetKey);
        setLength(presetData.l === '' ? '' : Number(presetData.l));
        setWidth(presetData.w === '' ? '' : Number(presetData.w));
        setHeight(presetData.h === '' ? '' : Number(presetData.h));
        setWeight(presetData.wg === '' ? '' : Number(presetData.wg));
        setValue(presetData.val === '' ? '' : Number(presetData.val));
        if(presetData.l !== '') setDimUnit('cm');
        if(presetData.wg !== '') setWeightUnit('kg');
    };

    const handleEstimate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');
        setApiRates([]);

        const weightNum = Number(weight);
        const valueNum = Number(value);

        if (!weightNum || !valueNum || weightNum <= 0 || valueNum <= 0) {
            alert(t('alertError'));
            setIsLoading(false);
            return;
        }

        // 1. Convertir a IMPERIAL (Libras/Pulgadas) para el Backend
        const weightLbs = weightUnit === 'kg' ? weightNum * 2.20462 : weightNum;
        const lengthIn = dimUnit === 'cm' ? Number(length) / 2.54 : Number(length);
        const widthIn = dimUnit === 'cm' ? Number(width) / 2.54 : Number(width);
        const heightIn = dimUnit === 'cm' ? Number(height) / 2.54 : Number(height);

        // 2. Obtener Nombre del País
        const selectedCountry = ALL_COUNTRIES.find(c => c.code === country);

        try {
            const res = await fetch('/api/rates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    weight: weightLbs, 
                    weightLbs: weightLbs,
                    dimensions: {
                        length: lengthIn,
                        width: widthIn,
                        height: heightIn
                    },
                    destination: {
                        countryCode: country,
                        countryName: selectedCountry?.name || '', 
                        country: country
                    }
                })
            });

            const data = await res.json();

            if (res.ok && data.rates && data.rates.length > 0) {
                setApiRates(data.rates);
                setIsModalVisible(true);
            } else {
                setErrorMsg('No se encontraron tarifas disponibles para esta ruta.');
            }

        } catch (error) {
            console.error(error);
            setErrorMsg('Error de conexión con el servidor de tarifas.');
        } finally {
            setIsLoading(false);
        }
    };

    // 🔥 CÁLCULO DEL DESGLOSE
    const calculateTotal = (basePrice: number, carrier: string = '') => {
        const val = Number(value) || 0;
        // Seguro: 3% del valor si es mayor a $100
        const insurance = val > 100 ? val * 0.03 : 0;
        
        // REGLA: Si es GMC/GASP, handling es 0. Si no, 10.
        const isGMC = carrier.toUpperCase().includes('GASP') || carrier.toUpperCase().includes('GMC');
        const handling = isGMC ? 0 : 10.00;

        return {
            total: basePrice + insurance + handling,
            insurance,
            handling
        };
    };

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-montserrat">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-bold text-gmc-gris-oscuro font-garamond mb-3 uppercase tracking-tight">
                        {t('title')}
                    </h1>
                    <p className="text-gray-500 text-lg">
                        {t('subtitle')}
                    </p>
                </div>
                
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                    <form onSubmit={handleEstimate} className="p-8 md:p-12">
                        
                        {/* 1. Destino */}
                        <div className="mb-10">
                            <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="bg-gmc-dorado-principal text-black w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">01</span>
                                {t('step1Title')}
                            </label>
                            
                            <div className="relative group">
                                <img 
                                    src={`https://flagcdn.com/w40/${country.toLowerCase()}.png`}
                                    alt="Flag"
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-auto shadow-sm rounded-sm pointer-events-none z-10"
                                    onError={(e) => e.currentTarget.style.display = 'none'}
                                />
                                <select
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    className="w-full pl-14 pr-10 py-4 border-2 border-gray-100 bg-gray-50 rounded-2xl text-gray-800 font-bold appearance-none focus:outline-none focus:border-gmc-dorado-principal focus:bg-white transition-all cursor-pointer"
                                >
                                    {sortedCountries.map(c => (
                                        <option key={c.code} value={c.code}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* 2. Carga */}
                        <div className="mb-10">
                            <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <span className="bg-gmc-dorado-principal text-black w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">02</span>
                                {t('step2Title')}
                            </label>
                            
                            {/* Presets */}
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
                                {Object.keys(presets).map((key) => {
                                    // @ts-ignore
                                    const preset = presets[key];
                                    const isActive = activePreset === key;
                                    return (
                                        <button
                                            key={key} type="button"
                                            onClick={() => handlePresetClick(key)}
                                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 ${isActive ? 'border-gmc-dorado-principal bg-yellow-50 text-black shadow-lg scale-105' : 'border-gray-50 bg-white text-gray-400 hover:border-gray-200'}`}
                                        >
                                            <preset.Icon size={24} className={`mb-2 ${isActive ? 'text-gmc-dorado-principal' : 'text-gray-300'}`} />
                                            <span className="text-[10px] font-black uppercase leading-tight">{preset.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{t('dimensionsLabel')}</span>
                                        <div className="flex bg-gray-100 p-1 rounded-xl">
                                            <button type="button" onClick={() => setDimUnit('cm')} className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${dimUnit === 'cm' ? 'bg-white shadow text-black' : 'text-gray-400'}`}>CM</button>
                                            <button type="button" onClick={() => setDimUnit('in')} className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${dimUnit === 'in' ? 'bg-white shadow text-black' : 'text-gray-400'}`}>IN</button>
                                        </div>
                                    </div>
                                    <div className="flex border-2 border-gray-100 rounded-2xl overflow-hidden focus-within:border-gmc-dorado-principal transition-colors bg-gray-50">
                                        <input type="number" placeholder="L" className="w-1/3 p-4 bg-transparent outline-none text-center border-r border-gray-100 font-bold" value={length} onChange={(e) => setLength(e.target.value === '' ? '' : Number(e.target.value))} />
                                        <input type="number" placeholder="W" className="w-1/3 p-4 bg-transparent outline-none text-center border-r border-gray-100 font-bold" value={width} onChange={(e) => setWidth(e.target.value === '' ? '' : Number(e.target.value))} />
                                        <input type="number" placeholder="H" className="w-1/3 p-4 bg-transparent outline-none text-center font-bold" value={height} onChange={(e) => setHeight(e.target.value === '' ? '' : Number(e.target.value))} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{t('weightLabel')}</span>
                                            <div className="flex bg-gray-100 p-1 rounded-xl">
                                                <button type="button" onClick={() => setWeightUnit('kg')} className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${weightUnit === 'kg' ? 'bg-white shadow text-black' : 'text-gray-400'}`}>KG</button>
                                                <button type="button" onClick={() => setWeightUnit('lbs')} className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${weightUnit === 'lbs' ? 'bg-white shadow text-black' : 'text-gray-400'}`}>LB</button>
                                            </div>
                                        </div>
                                        <input type="number" placeholder="0.0" className="w-full p-4 border-2 border-gray-100 bg-gray-50 rounded-2xl text-gray-800 font-bold focus:outline-none focus:border-gmc-dorado-principal focus:bg-white transition-all" value={weight} onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))} />
                                    </div>
                                    <div>
                                        <div className="mb-3"><span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{t('priceLabel')}</span></div>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">$</span>
                                            <input type="number" value={value} onChange={(e) => setValue(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0.00" className="w-full p-4 pl-8 border-2 border-gray-100 bg-gray-50 rounded-2xl text-gray-800 font-bold focus:outline-none focus:border-gmc-dorado-principal focus:bg-white transition-all" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-bold animate-fadeIn">
                                <AlertCircle size={20} />
                                {errorMsg}
                            </div>
                        )}

                        <button 
                            type="submit" disabled={isLoading} 
                            className="w-full py-5 bg-gmc-dorado-principal hover:bg-black hover:text-white text-black font-black rounded-2xl shadow-xl transition-all transform hover:-translate-y-1 text-sm uppercase tracking-widest flex justify-center items-center gap-3 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Calculator size={20} />}
                            {isLoading ? t('calculating') : t('calcBtn')}
                        </button>
                    </form>
                </div>
            </div>

            {/* Modal de Resultados Reales */}
            {isModalVisible && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden relative animate-in zoom-in-95">
                        <div className="bg-gmc-gris-oscuro p-8 text-white">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-3xl font-black font-garamond uppercase tracking-tighter">{t('resultTitle')}</h2>
                                    <p className="text-gmc-dorado-principal text-[10px] font-black uppercase tracking-widest mt-1">
                                        Estimated for {weight} {weightUnit}
                                    </p>
                                </div>
                                <button onClick={() => setIsModalVisible(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"><X size={24} /></button>
                            </div>
                        </div>

                        <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4">
                            {apiRates.map((rate, index) => {
                                // Pasamos el carrier al cálculo para detectar GMC
                                const details = calculateTotal(rate.price, rate.carrier);
                                
                                return (
                                    <div key={rate.id} className={`group border-2 rounded-[1.5rem] p-5 transition-all relative ${index === 0 ? 'border-gmc-dorado-principal bg-yellow-50/30' : 'border-gray-50 bg-white hover:border-gray-200'}`}>
                                        {index === 0 && (<div className="absolute top-0 right-0 bg-gmc-dorado-principal text-black text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase">Best Value</div>)}
                                        
                                        {/* 🔥 ESTRUCTURA DE GRID BLINDADA */}
                                        <div className="grid grid-cols-[3.5rem_1fr_min-content] gap-4 items-center mb-4">
                                            {/* Col 1: Logo (Ancho Fijo) */}
                                            <div className="bg-white p-2 rounded-xl border border-gray-100 h-14 w-14 flex items-center justify-center shadow-sm shrink-0">
                                                <img 
                                                    src={rate.logo || "/gaspmakercargoproject.png"} 
                                                    alt={rate.carrier} 
                                                    className="max-h-full max-w-full object-contain" 
                                                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/gaspmakercargoproject.png" }}
                                                />
                                            </div>
                                            
                                            {/* Col 2: Info Texto */}
                                            <div className="overflow-hidden">
                                                <h3 className="font-black text-gray-900 text-sm uppercase truncate">
                                                    {/* Usamos el helper para limpiar el nombre (UPSDAP -> UPS) */}
                                                    {cleanCarrierName(rate.carrier)}
                                                </h3>
                                                <p className="text-[10px] text-gray-400 font-bold truncate">{rate.service}</p>
                                            </div>

                                            {/* Col 3: Precio (Ancho Min Fijo) */}
                                            <div className="text-right min-w-[5rem]">
                                                <p className="text-2xl font-black text-gray-900 leading-none">${details.total.toFixed(2)}</p>
                                                <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Total</p>
                                            </div>
                                        </div>

                                        {/* 🔥 DESGLOSE EN GRID */}
                                        <div className="grid grid-cols-2 gap-4 text-[10px] font-bold text-gray-500 border-t border-dashed border-gray-200 pt-4 mb-4 items-start">
                                            <div className="flex items-center gap-2">
                                                <Truck size={14} className="text-gmc-dorado-principal shrink-0"/> 
                                                <span>{rate.days}</span>
                                            </div>
                                            
                                            <div className="flex flex-col text-right gap-0.5">
                                                <span className="text-gray-700">Ship: ${rate.price.toFixed(2)}</span>
                                                {details.insurance > 0 && (
                                                    <span className="text-blue-600">+ Ins: ${details.insurance.toFixed(2)}</span>
                                                )}
                                                {/* Solo mostramos el fee si es mayor a 0 */}
                                                {details.handling > 0 && (
                                                    <span className="text-gray-400 whitespace-nowrap">+ Fee: ${details.handling.toFixed(2)}</span>
                                                )}
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => { setIsModalVisible(false); router.push('/registro-cliente'); }}
                                            className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${index === 0 ? 'bg-black text-white hover:bg-gmc-dorado-principal hover:text-black' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                        >
                                            {t('selectRate')}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-6 bg-gray-50 text-center">
                            <p className="text-[9px] text-gray-400 font-medium px-8 italic">{t('note')}</p>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}