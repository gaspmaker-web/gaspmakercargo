'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Key, Globe, Truck, Package, AlertTriangle } from 'lucide-react';

// Países disponibles
const COUNTRIES = [
  { code: 'DO', name: '🇩🇴 República Dominicana' },
  { code: 'TT', name: '🇹🇹 Trinidad y Tobago' },
  { code: 'BB', name: '🇧🇧 Barbados' },
  { code: 'JM', name: '🇯🇲 Jamaica' },
  { code: 'GD', name: '🇬🇩 Granada' },
  { code: 'VE', name: '🇻🇪 Venezuela' },
  { code: 'CO', name: '🇨🇴 Colombia' },
  { code: 'MX', name: '🇲🇽 México' },
  { code: 'PA', name: '🇵🇦 Panamá' },
  { code: 'CL', name: '🇨🇱 Chile' },
  { code: 'VI', name: '🇻🇮 St. Thomas' },
  { code: 'CU', name: '🇨🇺 Cuba' },
  { code: 'AG', name: '🇦🇬 Antigua' },
  { code: 'DM', name: '🇩🇲 Dominica' },
  { code: 'GY', name: '🇬🇾 Guyana' },
  { code: 'LC', name: '🇱🇨 St. Lucia' },
  { code: 'VC', name: '🇻🇨 St. Vincent' },
  { code: 'MF', name: '🇸🇽 St. Maarten' },
  { code: 'SR', name: '🇸🇷 Suriname' },
];

interface Rate {
  id?: string;
  concept: string;
  countryCode: string | null | undefined;
  value: number;
}

interface ApiKeys {
  easypost_api_key: string;
  stripe_publishable_key: string;
  stripe_secret_key: string;
}

export default function ConfiguracionPage() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({ easypost_api_key: '', stripe_publishable_key: '', stripe_secret_key: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'international' | 'global' | 'local' | 'apis'>('international');
  const [newCountry, setNewCountry] = useState('');

  useEffect(() => {
    fetch('/api/admin/rates')
      .then(r => r.json())
      .then(data => {
        setRates(data.rates || []);
        setApiKeys(data.apiKeys || {});
        setLoading(false);
      });
  }, []);

  const getRate = (concept: string, countryCode: string | null = null) => {
    const r = rates.find(r => r.concept === concept && r.countryCode === countryCode);
    return r?.value ?? 0;
  };

  const setRate = (concept: string, countryCode: string | null, value: number) => {
    setRates(prev => {
      const exists = prev.findIndex(r => r.concept === concept && r.countryCode === countryCode);
      if (exists >= 0) {
        const updated = [...prev];
        updated[exists] = { ...updated[exists], value };
        return updated;
      }
      return [...prev, { concept, countryCode, value }];
    });
  };

  const deleteCountry = async (countryCode: string) => {
    await fetch('/api/admin/rates', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concept: 'air_per_lb', countryCode }),
    });
    setRates(prev => prev.filter(r => r.countryCode !== countryCode));
  };

  const addCountry = () => {
    if (!newCountry) return;
    const exists = rates.some(r => r.countryCode === newCountry && r.concept === 'air_per_lb');
    if (!exists) {
      setRates(prev => [...prev,
        { concept: 'air_per_lb', countryCode: newCountry, value: 0 },
        { concept: 'min_rate', countryCode: newCountry, value: 0 },
        { concept: 'ocean_per_cuft', countryCode: newCountry, value: 0 },
      ]);
    }
    setNewCountry('');
  };

  const save = async () => {
    setSaving(true);
    await fetch('/api/admin/rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rates, apiKeys }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Países únicos con tarifas internacionales
const internationalCountries = Array.from(new Set(
  rates
    .filter((r): r is Rate & { countryCode: string } => r.countryCode !== null && r.countryCode !== undefined && r.concept === 'air_per_lb')
    .map(r => r.countryCode)
));
  if (loading) return <div className="p-8 text-center text-gray-500">Cargando configuración...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
            <p className="text-sm text-gray-500 mt-1">Tarifas, cargos y conexiones</p>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-800 transition disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Guardando...' : saved ? '✅ Guardado' : 'Guardar Todo'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {[
            { id: 'international', label: 'Internacional', icon: Globe },
            { id: 'global', label: 'Variables', icon: Package },
            { id: 'local', label: 'Delivery Local', icon: Truck },
            { id: 'apis', label: 'API Keys', icon: Key },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                activeTab === id ? 'bg-black text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* TAB: INTERNACIONAL */}
        {activeTab === 'international' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Tarifas por País</h2>
              <div className="flex gap-2">
                <select
                  value={newCountry}
                  onChange={e => setNewCountry(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2"
                >
                  <option value="">+ Agregar país</option>
                  {COUNTRIES.filter(c => !internationalCountries.includes(c.code)).map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
                <button onClick={addCountry} className="bg-black text-white px-3 py-2 rounded-lg text-sm">
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-500">País</th>
                    <th className="text-center p-4 font-medium text-gray-500">Aéreo /lb</th>
                    <th className="text-center p-4 font-medium text-gray-500">Marítimo /ft³</th>
                    <th className="text-center p-4 font-medium text-gray-500">Mínimo</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {internationalCountries.map(code => {
                    const country = COUNTRIES.find(c => c.code === code);
                    return (
                      <tr key={code} className="border-t border-gray-50">
                        <td className="p-4 font-medium">{country?.name || code}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-gray-400">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={getRate('air_per_lb', code)}
                              onChange={e => setRate('air_per_lb', code, parseFloat(e.target.value) || 0)}
                              className="w-20 text-center border border-gray-200 rounded-lg px-2 py-1"
                            />
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-gray-400">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={getRate('ocean_per_cuft', code)}
                              onChange={e => setRate('ocean_per_cuft', code, parseFloat(e.target.value) || 0)}
                              className="w-20 text-center border border-gray-200 rounded-lg px-2 py-1"
                            />
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-gray-400">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={getRate('min_rate', code)}
                              onChange={e => setRate('min_rate', code, parseFloat(e.target.value) || 0)}
                              className="w-20 text-center border border-gray-200 rounded-lg px-2 py-1"
                            />
                          </div>
                        </td>
                        <td className="p-4">
                          <button onClick={() => deleteCountry(code)} className="text-red-400 hover:text-red-600">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: VARIABLES GLOBALES */}
        {activeTab === 'global' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-4">Variables Globales</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { concept: 'insurance_pct', label: 'Seguro (%)', multiplier: 100, suffix: '%' },
                  { concept: 'easypost_markup', label: 'Markup EasyPost (multiplicador)', multiplier: 1, suffix: 'x' },
                  { concept: 'handling_standard', label: 'Handling Estándar /lb', multiplier: 1, suffix: '$' },
                  { concept: 'handling_vip', label: 'Handling VIP /lb', multiplier: 1, suffix: '$' },
                  { concept: 'ttd_exchange_rate', label: 'Tasa TTD (TT$)', multiplier: 1, suffix: 'TT$' },
                  { concept: 'storage_per_cuft_per_month', label: 'Almacenaje /ft³/mes', multiplier: 1, suffix: '$' },
                  { concept: 'storage_free_days', label: 'Días gratis almacenaje', multiplier: 1, suffix: 'días' },
                ].map(({ concept, label, multiplier, suffix }) => (
                  <div key={concept}>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">{label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={getRate(concept) * multiplier}
                        onChange={e => setRate(concept, null, (parseFloat(e.target.value) || 0) / multiplier)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      />
                      <span className="text-gray-400 text-sm">{suffix}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle size={16} className="text-orange-500" />
                Cargos Especiales / Hazmat
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { concept: 'hazmat_prep_fee', label: 'Hazmat Prep Fee' },
                  { concept: 'hazmat_shipping_line_fee', label: 'Hazmat Shipping Line Fee' },
                  { concept: 'air_hazmat_fee', label: 'Air Hazmat Compliance Fee' },
                  { concept: 'eei_fee', label: 'Trámite EEI (Aduana)' },
                ].map(({ concept, label }) => (
                  <div key={concept}>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">{label}</label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={getRate(concept)}
                        onChange={e => setRate(concept, null, parseFloat(e.target.value) || 0)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-4">Handling Bodega (Retiro Físico)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { concept: 'handling_mini_0_10lbs', label: 'Mini (0-10 lbs)' },
                  { concept: 'handling_standard_11_50lbs', label: 'Estándar (11-50 lbs)' },
                  { concept: 'handling_heavy_51_150lbs', label: 'Pesado (51-150 lbs)' },
                  { concept: 'handling_pallet_150plus', label: 'Pallet (+150 lbs)' },
                ].map(({ concept, label }) => (
                  <div key={concept}>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">{label}</label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={getRate(concept)}
                        onChange={e => setRate(concept, null, parseFloat(e.target.value) || 0)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: DELIVERY LOCAL */}
        {activeTab === 'local' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-4">Delivery Local Miami</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { concept: 'local_base_radius_miles', label: 'Radio base incluido (millas)' },
                { concept: 'local_per_mile_car_suv', label: 'Por milla — Car/SUV' },
                { concept: 'local_per_mile_minivan', label: 'Por milla — Minivan' },
                { concept: 'local_per_mile_cargo_van', label: 'Por milla — Cargo Van' },
                { concept: 'local_per_mile_box_truck', label: 'Por milla — Box Truck' },
                { concept: 'local_pre_built_pallet_flat', label: 'Pallet pre-armado (flat)' },
                { concept: 'local_pre_built_radius_miles', label: 'Radio pallet pre-armado (millas)' },
              ].map(({ concept, label }) => (
                <div key={concept}>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">{label}</label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={getRate(concept)}
                      onChange={e => setRate(concept, null, parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: API KEYS */}
        {activeTab === 'apis' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-1">Conexiones API</h2>
            <p className="text-sm text-gray-500 mb-5">Tus credenciales se guardan de forma segura y nunca se comparten.</p>
            <div className="space-y-4">
              {[
                { key: 'easypost_api_key', label: 'EasyPost API Key', placeholder: 'EZTKxxxxxxx...' },
                { key: 'stripe_publishable_key', label: 'Stripe Publishable Key', placeholder: 'pk_live_...' },
                { key: 'stripe_secret_key', label: 'Stripe Secret Key', placeholder: 'sk_live_...' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">{label}</label>
                  <input
                    type="password"
                    placeholder={placeholder}
                    value={apiKeys[key as keyof ApiKeys] || ''}
                    onChange={e => setApiKeys(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}