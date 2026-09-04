'use client';

import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Key, Globe, Truck, Package, AlertTriangle } from 'lucide-react';

// Países disponibles
const COUNTRIES = [
  { code: 'AF', name: '🇦🇫 Afghanistan' },
  { code: 'AL', name: '🇦🇱 Albania' },
  { code: 'DZ', name: '🇩🇿 Algeria' },
  { code: 'AD', name: '🇦🇩 Andorra' },
  { code: 'AO', name: '🇦🇴 Angola' },
  { code: 'AG', name: '🇦🇬 Antigua and Barbuda' },
  { code: 'AR', name: '🇦🇷 Argentina' },
  { code: 'AM', name: '🇦🇲 Armenia' },
  { code: 'AU', name: '🇦🇺 Australia' },
  { code: 'AT', name: '🇦🇹 Austria' },
  { code: 'AZ', name: '🇦🇿 Azerbaijan' },
  { code: 'BS', name: '🇧🇸 Bahamas' },
  { code: 'BH', name: '🇧🇭 Bahrain' },
  { code: 'BD', name: '🇧🇩 Bangladesh' },
  { code: 'BB', name: '🇧🇧 Barbados' },
  { code: 'BY', name: '🇧🇾 Belarus' },
  { code: 'BE', name: '🇧🇪 Belgium' },
  { code: 'BZ', name: '🇧🇿 Belize' },
  { code: 'BJ', name: '🇧🇯 Benin' },
  { code: 'BT', name: '🇧🇹 Bhutan' },
  { code: 'BO', name: '🇧🇴 Bolivia' },
  { code: 'BA', name: '🇧🇦 Bosnia and Herzegovina' },
  { code: 'BW', name: '🇧🇼 Botswana' },
  { code: 'BR', name: '🇧🇷 Brazil' },
  { code: 'BN', name: '🇧🇳 Brunei' },
  { code: 'BG', name: '🇧🇬 Bulgaria' },
  { code: 'BF', name: '🇧🇫 Burkina Faso' },
  { code: 'BI', name: '🇧🇮 Burundi' },
  { code: 'CV', name: '🇨🇻 Cape Verde' },
  { code: 'KH', name: '🇰🇭 Cambodia' },
  { code: 'CM', name: '🇨🇲 Cameroon' },
  { code: 'CA', name: '🇨🇦 Canada' },
  { code: 'CF', name: '🇨🇫 Central African Republic' },
  { code: 'TD', name: '🇹🇩 Chad' },
  { code: 'CL', name: '🇨🇱 Chile' },
  { code: 'CN', name: '🇨🇳 China' },
  { code: 'CO', name: '🇨🇴 Colombia' },
  { code: 'KM', name: '🇰🇲 Comoros' },
  { code: 'CG', name: '🇨🇬 Congo' },
  { code: 'CR', name: '🇨🇷 Costa Rica' },
  { code: 'HR', name: '🇭🇷 Croatia' },
  { code: 'CU', name: '🇨🇺 Cuba' },
  { code: 'CY', name: '🇨🇾 Cyprus' },
  { code: 'CZ', name: '🇨🇿 Czech Republic' },
  { code: 'DK', name: '🇩🇰 Denmark' },
  { code: 'DJ', name: '🇩🇯 Djibouti' },
  { code: 'DM', name: '🇩🇲 Dominica' },
  { code: 'DO', name: '🇩🇴 Dominican Republic' },
  { code: 'EC', name: '🇪🇨 Ecuador' },
  { code: 'EG', name: '🇪🇬 Egypt' },
  { code: 'SV', name: '🇸🇻 El Salvador' },
  { code: 'GQ', name: '🇬🇶 Equatorial Guinea' },
  { code: 'ER', name: '🇪🇷 Eritrea' },
  { code: 'EE', name: '🇪🇪 Estonia' },
  { code: 'SZ', name: '🇸🇿 Eswatini' },
  { code: 'ET', name: '🇪🇹 Ethiopia' },
  { code: 'FJ', name: '🇫🇯 Fiji' },
  { code: 'FI', name: '🇫🇮 Finland' },
  { code: 'FR', name: '🇫🇷 France' },
  { code: 'GA', name: '🇬🇦 Gabon' },
  { code: 'GM', name: '🇬🇲 Gambia' },
  { code: 'GE', name: '🇬🇪 Georgia' },
  { code: 'DE', name: '🇩🇪 Germany' },
  { code: 'GH', name: '🇬🇭 Ghana' },
  { code: 'GR', name: '🇬🇷 Greece' },
  { code: 'GD', name: '🇬🇩 Grenada' },
  { code: 'GT', name: '🇬🇹 Guatemala' },
  { code: 'GN', name: '🇬🇳 Guinea' },
  { code: 'GW', name: '🇬🇼 Guinea-Bissau' },
  { code: 'GY', name: '🇬🇾 Guyana' },
  { code: 'HT', name: '🇭🇹 Haiti' },
  { code: 'HN', name: '🇭🇳 Honduras' },
  { code: 'HU', name: '🇭🇺 Hungary' },
  { code: 'IS', name: '🇮🇸 Iceland' },
  { code: 'IN', name: '🇮🇳 India' },
  { code: 'ID', name: '🇮🇩 Indonesia' },
  { code: 'IR', name: '🇮🇷 Iran' },
  { code: 'IQ', name: '🇮🇶 Iraq' },
  { code: 'IE', name: '🇮🇪 Ireland' },
  { code: 'IL', name: '🇮🇱 Israel' },
  { code: 'IT', name: '🇮🇹 Italy' },
  { code: 'JM', name: '🇯🇲 Jamaica' },
  { code: 'JP', name: '🇯🇵 Japan' },
  { code: 'JO', name: '🇯🇴 Jordan' },
  { code: 'KZ', name: '🇰🇿 Kazakhstan' },
  { code: 'KE', name: '🇰🇪 Kenya' },
  { code: 'KI', name: '🇰🇮 Kiribati' },
  { code: 'KW', name: '🇰🇼 Kuwait' },
  { code: 'KG', name: '🇰🇬 Kyrgyzstan' },
  { code: 'LA', name: '🇱🇦 Laos' },
  { code: 'LV', name: '🇱🇻 Latvia' },
  { code: 'LB', name: '🇱🇧 Lebanon' },
  { code: 'LS', name: '🇱🇸 Lesotho' },
  { code: 'LR', name: '🇱🇷 Liberia' },
  { code: 'LY', name: '🇱🇾 Libya' },
  { code: 'LI', name: '🇱🇮 Liechtenstein' },
  { code: 'LT', name: '🇱🇹 Lithuania' },
  { code: 'LU', name: '🇱🇺 Luxembourg' },
  { code: 'MG', name: '🇲🇬 Madagascar' },
  { code: 'MW', name: '🇲🇼 Malawi' },
  { code: 'MY', name: '🇲🇾 Malaysia' },
  { code: 'MV', name: '🇲🇻 Maldives' },
  { code: 'ML', name: '🇲🇱 Mali' },
  { code: 'MT', name: '🇲🇹 Malta' },
  { code: 'MH', name: '🇲🇭 Marshall Islands' },
  { code: 'MR', name: '🇲🇷 Mauritania' },
  { code: 'MU', name: '🇲🇺 Mauritius' },
  { code: 'MX', name: '🇲🇽 Mexico' },
  { code: 'FM', name: '🇫🇲 Micronesia' },
  { code: 'MD', name: '🇲🇩 Moldova' },
  { code: 'MC', name: '🇲🇨 Monaco' },
  { code: 'MN', name: '🇲🇳 Mongolia' },
  { code: 'ME', name: '🇲🇪 Montenegro' },
  { code: 'MA', name: '🇲🇦 Morocco' },
  { code: 'MZ', name: '🇲🇿 Mozambique' },
  { code: 'MM', name: '🇲🇲 Myanmar' },
  { code: 'NA', name: '🇳🇦 Namibia' },
  { code: 'NR', name: '🇳🇷 Nauru' },
  { code: 'NP', name: '🇳🇵 Nepal' },
  { code: 'NL', name: '🇳🇱 Netherlands' },
  { code: 'NZ', name: '🇳🇿 New Zealand' },
  { code: 'NI', name: '🇳🇮 Nicaragua' },
  { code: 'NE', name: '🇳🇪 Niger' },
  { code: 'NG', name: '🇳🇬 Nigeria' },
  { code: 'NO', name: '🇳🇴 Norway' },
  { code: 'OM', name: '🇴🇲 Oman' },
  { code: 'PK', name: '🇵🇰 Pakistan' },
  { code: 'PW', name: '🇵🇼 Palau' },
  { code: 'PA', name: '🇵🇦 Panama' },
  { code: 'PG', name: '🇵🇬 Papua New Guinea' },
  { code: 'PY', name: '🇵🇾 Paraguay' },
  { code: 'PE', name: '🇵🇪 Peru' },
  { code: 'PH', name: '🇵🇭 Philippines' },
  { code: 'PL', name: '🇵🇱 Poland' },
  { code: 'PT', name: '🇵🇹 Portugal' },
  { code: 'QA', name: '🇶🇦 Qatar' },
  { code: 'RO', name: '🇷🇴 Romania' },
  { code: 'RU', name: '🇷🇺 Russia' },
  { code: 'RW', name: '🇷🇼 Rwanda' },
  { code: 'KN', name: '🇰🇳 Saint Kitts and Nevis' },
  { code: 'LC', name: '🇱🇨 Saint Lucia' },
  { code: 'VC', name: '🇻🇨 Saint Vincent and the Grenadines' },
  { code: 'WS', name: '🇼🇸 Samoa' },
  { code: 'SM', name: '🇸🇲 San Marino' },
  { code: 'ST', name: '🇸🇹 Sao Tome and Principe' },
  { code: 'SA', name: '🇸🇦 Saudi Arabia' },
  { code: 'SN', name: '🇸🇳 Senegal' },
  { code: 'RS', name: '🇷🇸 Serbia' },
  { code: 'SC', name: '🇸🇨 Seychelles' },
  { code: 'SL', name: '🇸🇱 Sierra Leone' },
  { code: 'SG', name: '🇸🇬 Singapore' },
  { code: 'SK', name: '🇸🇰 Slovakia' },
  { code: 'SI', name: '🇸🇮 Slovenia' },
  { code: 'SB', name: '🇸🇧 Solomon Islands' },
  { code: 'SO', name: '🇸🇴 Somalia' },
  { code: 'ZA', name: '🇿🇦 South Africa' },
  { code: 'SS', name: '🇸🇸 South Sudan' },
  { code: 'ES', name: '🇪🇸 Spain' },
  { code: 'LK', name: '🇱🇰 Sri Lanka' },
  { code: 'SD', name: '🇸🇩 Sudan' },
  { code: 'SR', name: '🇸🇷 Suriname' },
  { code: 'SE', name: '🇸🇪 Sweden' },
  { code: 'CH', name: '🇨🇭 Switzerland' },
  { code: 'SY', name: '🇸🇾 Syria' },
  { code: 'TW', name: '🇹🇼 Taiwan' },
  { code: 'TJ', name: '🇹🇯 Tajikistan' },
  { code: 'TZ', name: '🇹🇿 Tanzania' },
  { code: 'TH', name: '🇹🇭 Thailand' },
  { code: 'TL', name: '🇹🇱 Timor-Leste' },
  { code: 'TG', name: '🇹🇬 Togo' },
  { code: 'TO', name: '🇹🇴 Tonga' },
  { code: 'TT', name: '🇹🇹 Trinidad and Tobago' },
  { code: 'TN', name: '🇹🇳 Tunisia' },
  { code: 'TR', name: '🇹🇷 Turkey' },
  { code: 'TM', name: '🇹🇲 Turkmenistan' },
  { code: 'TV', name: '🇹🇻 Tuvalu' },
  { code: 'UG', name: '🇺🇬 Uganda' },
  { code: 'UA', name: '🇺🇦 Ukraine' },
  { code: 'AE', name: '🇦🇪 United Arab Emirates' },
  { code: 'GB', name: '🇬🇧 United Kingdom' },
  { code: 'US', name: '🇺🇸 United States' },
  { code: 'UY', name: '🇺🇾 Uruguay' },
  { code: 'UZ', name: '🇺🇿 Uzbekistan' },
  { code: 'VU', name: '🇻🇺 Vanuatu' },
  { code: 'VE', name: '🇻🇪 Venezuela' },
  { code: 'VN', name: '🇻🇳 Vietnam' },
  { code: 'YE', name: '🇾🇪 Yemen' },
  { code: 'ZM', name: '🇿🇲 Zambia' },
  { code: 'ZW', name: '🇿🇼 Zimbabwe' },
  // Territorios especiales
  { code: 'VI', name: '🇻🇮 U.S. Virgin Islands' },
  { code: 'PR', name: '🇵🇷 Puerto Rico' },
  { code: 'MF', name: '🇸🇽 Sint Maarten' },
  { code: 'GP', name: '🇬🇵 Guadeloupe' },
  { code: 'MQ', name: '🇲🇶 Martinique' },
  { code: 'GF', name: '🇬🇫 French Guiana' },
  { code: 'CW', name: '🇨🇼 Curaçao' },
  { code: 'AW', name: '🇦🇼 Aruba' },
];

interface Rate {
  id?: string;
  concept: string;
  countryCode: string | null | undefined;
  value: number;
  textValue?: string;
}

interface ApiKeys {
  easypost_api_key: string;
  stripe_publishable_key: string;
  stripe_secret_key: string;
}

export default function ConfiguracionPage() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [dirtyRates, setDirtyRates] = useState<Set<string>>(new Set());
  const [apiKeys, setApiKeys] = useState<ApiKeys>({ easypost_api_key: '', stripe_publishable_key: '', stripe_secret_key: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'international' | 'global' | 'local' | 'driver' | 'apis'>('international');
  const [newCountry, setNewCountry] = useState('');
  const [mailboxPriceIds, setMailboxPriceIds] = useState({
    stripe_mailbox_basic_price_id: '',
    stripe_mailbox_premium_price_id: '',
  });

useEffect(() => {
  fetch('/api/admin/rates')
    .then(r => r.json())
    .then(data => {
      setRates(data.rates || []);
      setApiKeys(data.apiKeys || {});
      setMailboxPriceIds({
        stripe_mailbox_basic_price_id: data.mailboxPriceIds?.stripe_mailbox_basic_price_id || '',
        stripe_mailbox_premium_price_id: data.mailboxPriceIds?.stripe_mailbox_premium_price_id || '',
      });
      setLoading(false);
    });
}, []);

  const getTextRate = (concept: string, countryCode: string | null = null) => {
  const r = rates.find(r => r.concept === concept && r.countryCode === countryCode);
  return r?.textValue ?? '';
};

const setTextRate = (concept: string, countryCode: string | null, value: string) => {
  setDirtyRates(prev => new Set(prev).add(`${concept}__${countryCode ?? ''}`));
  setRates(prev => {
    const exists = prev.findIndex(r => r.concept === concept && r.countryCode === countryCode);
    if (exists >= 0) {
      const updated = [...prev];
      updated[exists] = { ...updated[exists], textValue: value };
      return updated;
    }
    return [...prev, { concept, countryCode, value: 0, textValue: value }];
  });
};

  const getRate = (concept: string, countryCode: string | null = null) => {
    const r = rates.find(r => r.concept === concept && r.countryCode === countryCode);
    return r?.value ?? 0;
  };

const setRate = (concept: string, countryCode: string | null, value: number) => {
    setDirtyRates(prev => new Set(prev).add(`${concept}__${countryCode ?? ''}`));
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
    body: JSON.stringify({ countryCode }),
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
      { concept: 'min_rate_mid', countryCode: newCountry, value: 0 },
      { concept: 'ocean_per_cuft', countryCode: newCountry, value: 0 },
      { concept: 'ocean_min_1_5cuft', countryCode: newCountry, value: 0 },
    ]);
  }
  setNewCountry('');
};

const save = async () => {
    setSaving(true);
    try {
      const changedRates = rates.filter(r => 
        dirtyRates.has(`${r.concept}__${r.countryCode ?? ''}`)
      );
      const res = await fetch('/api/admin/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rates: changedRates, apiKeys, mailboxPriceIds }),
      });
      if (res.ok) {
        setSaved(true);
        setDirtyRates(new Set());
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Error saving rates');
      }
    } catch (e) {
      console.error('Save error:', e);
      alert('Connection error');
    } finally {
      setSaving(false);
    }
  };
// Países únicos con tarifas internacionales
const internationalCountries = Array.from(new Set(
  rates
    .filter((r): r is Rate & { countryCode: string } => 
      r.countryCode !== null && 
      r.countryCode !== undefined && 
      ['air_per_lb', 'ocean_per_cuft'].includes(r.concept)
    )
    .map(r => r.countryCode)
));
  if (loading) return <div className="p-8 text-center text-gray-500">Loading configuration...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuration</h1>
            <p className="text-sm text-gray-500 mt-1">Rates, charges and connections</p>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-800 transition disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Saving...' : saved ? '✅ Saved' : 'Save All'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {[
            { id: 'international', label: 'International', icon: Globe },
            { id: 'global', label: 'Variables ✅', icon: Package },
            { id: 'local', label: 'Local Delivery', icon: Truck },
            { id: 'driver', label: 'Driver Pay 🚗', icon: Truck },
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
              <h2 className="font-bold text-gray-900">Rates by Country</h2>
              <div className="flex gap-2">
                <select
                  value={newCountry}
                  onChange={e => setNewCountry(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2"
                >
                  <option value="">+ Add country</option>
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
  <th className="text-left p-4 font-medium text-gray-500">Country</th>
  <th className="text-center p-4 font-medium text-gray-500">Air /lb</th>
  <th className="text-center p-4 font-medium text-gray-500">Min. Air (0-10 lbs)</th>
  <th className="text-center p-4 font-medium text-gray-500">Min. Air (11-36 lbs)</th>
  <th className="text-center p-4 font-medium text-gray-500">Ocean /ft³</th>
  <th className="text-center p-4 font-medium text-gray-500">Min. Ocean</th>
  <th className="p-4"></th>
</tr>
</thead>
<tbody>
  {internationalCountries.map(code => {
    const country = COUNTRIES.find(c => c.code === code);
    const isExpanded = expandedCountry === code;
   return (
  <React.Fragment key={code}>
    <tr className="border-t border-gray-50">
      <td className="p-4 font-medium">
        <button
          onClick={() => setExpandedCountry(isExpanded ? null : code)}
          className="flex items-center gap-2 hover:text-blue-600 transition-colors whitespace-nowrap"
        >
          {country?.name || code}
          <span className="text-xs text-gray-400">{isExpanded ? '▲' : '▼'}</span>
        </button>
      </td>

          {/* Aéreo /lb */}
          <td className="p-4">
            <div className="flex items-center justify-center gap-1">
              <span className="text-gray-400">$</span>
              <input type="number" step="0.01"
                value={getRate('air_per_lb', code)}
                onChange={e => setRate('air_per_lb', code, parseFloat(e.target.value) || 0)}
                className="w-20 text-center border border-gray-200 rounded-lg px-2 py-1"
              />
            </div>
          </td>

      {/* Min. Air (0-10 lbs) */}
<td className="p-4">
  <div className="flex items-center justify-center gap-1">
    <span className="text-gray-400">$</span>
    <input type="number" step="0.01"
      value={getRate('min_rate', code)}
      onChange={e => setRate('min_rate', code, parseFloat(e.target.value) || 0)}
      className="w-20 text-center border border-gray-200 rounded-lg px-2 py-1"
    />
  </div>
</td>

{/* Min. Air (11-44 lbs) */}
<td className="p-4">
  <div className="flex items-center justify-center gap-1">
    <span className="text-gray-400">$</span>
    <input type="number" step="0.01"
      value={getRate('min_rate_mid', code)}
      onChange={e => setRate('min_rate_mid', code, parseFloat(e.target.value) || 0)}
      className="w-20 text-center border border-gray-200 rounded-lg px-2 py-1"
    />
  </div>
</td>

          {/* Marítimo /ft³ */}
          <td className="p-4">
            <div className="flex items-center justify-center gap-1">
              <span className="text-gray-400">$</span>
              <input type="number" step="0.01"
                value={getRate('ocean_per_cuft', code)}
                onChange={e => setRate('ocean_per_cuft', code, parseFloat(e.target.value) || 0)}
                className="w-20 text-center border border-gray-200 rounded-lg px-2 py-1"
              />
            </div>
          </td>

          {/* Mín. Marítimo (1-5 cuft) */}
          <td className="p-4">
            <div className="flex items-center justify-center gap-1">
              <span className="text-gray-400">$</span>
              <input type="number" step="0.01"
                value={getRate('ocean_min_1_5cuft', code)}
                onChange={e => setRate('ocean_min_1_5cuft', code, parseFloat(e.target.value) || 0)}
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

        {/* Fila expandible — rangos marítimos */}
        {isExpanded && (
          <tr key={`${code}-expanded`} className="bg-blue-50 border-t border-blue-100">
            <td colSpan={6} className="px-6 py-4">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">
                🚢 Ocean Ranges (fixed cuft)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { concept: 'ocean_min_6_10cuft',  label: '6-10 cuft' },
                  { concept: 'ocean_min_11_15cuft', label: '11-15 cuft' },
                  { concept: 'ocean_min_16_20cuft', label: '16-20 cuft' },
                  { concept: 'ocean_min_21_25cuft', label: '21-25 cuft' },
                ].map(({ concept, label }) => (
                  <div key={concept}>
                    <label className="text-xs text-blue-600 font-bold block mb-1">{label}</label>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400 text-sm">$</span>
                      <input
          type="number"
                        step="0.01"
                        value={getRate(concept, code)}
                        onChange={e => setRate(concept, code, parseFloat(e.target.value) || 0)}
                        className="w-full border border-blue-200 rounded-lg px-2 py-1.5 text-sm bg-white"
                      />
                    </div>
                  </div>
                ))}
        </div>

            {/* Días de entrega */}
              <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-3 mt-4">
                ✈️ Air Days / 🚢 Ocean Days
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-green-600 font-bold block mb-1">	Air Days</label>
                  <select
                    value={getTextRate('air_days', code)}
                    onChange={e => setTextRate('air_days', code, e.target.value)}
                    className="w-full border border-green-200 rounded-lg px-2 py-1.5 text-sm bg-white"
                  >
                    <option value="">— Select —</option>
                    <option value="same_day">Same day</option>
                    <option value="next_day">Next day</option>
                    <option value="2_3_days">2-3 days</option>
                    <option value="3_5_days">3-5 days</option>
                    <option value="5_7_days">5-7 days</option>
                    <option value="7_14_days">7-14 days</option>
                    <option value="14_21_days">14-21 days</option>
                    <option value="15_21_days">15-21 days</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-green-600 font-bold block mb-1">Ocean Days</label>
                  <select
                    value={getTextRate('ocean_days', code)}
                    onChange={e => setTextRate('ocean_days', code, e.target.value)}
                    className="w-full border border-green-200 rounded-lg px-2 py-1.5 text-sm bg-white"
                  >
                    <option value="">— Select —</option>
                    <option value="same_day">Same day</option>
                    <option value="next_day">Next day</option>
                    <option value="2_3_days">2-3 days</option>
                    <option value="3_5_days">3-5 days</option>
                    <option value="5_7_days">5-7 days</option>
                    <option value="7_14_days">7-14 days</option>
                    <option value="14_21_days">14-21 days</option>
                    <option value="15_21_days">15-21 days</option>
                  </select>
                </div>
           </div>

              {/* 🌟 VIP Wholesale */}
              <p className="text-xs font-bold text-yellow-700 uppercase tracking-wider mb-3 mt-4">
                🌟 VIP Wholesale
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-yellow-600 font-bold block mb-1">Min Weight (lbs)</label>
                  <input
                    type="number" step="1"
                    value={getRate('vip_wholesale_min_weight', code) || 230}
                    onChange={e => setRate('vip_wholesale_min_weight', code, parseFloat(e.target.value) || 0)}
                    className="w-full border border-yellow-200 rounded-lg px-2 py-1.5 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-yellow-600 font-bold block mb-1">Air Rate ($/lb)</label>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400 text-sm">$</span>
                    <input
                      type="number" step="0.01"
                      value={getRate('vip_wholesale_rate_air', code) || 2.80}
                      onChange={e => setRate('vip_wholesale_rate_air', code, parseFloat(e.target.value) || 0)}
                      className="w-full border border-yellow-200 rounded-lg px-2 py-1.5 text-sm bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-yellow-600 font-bold block mb-1">Ocean Rate ($/cuft)</label>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400 text-sm">$</span>
                    <input
                      type="number" step="0.01"
                      value={getRate('vip_wholesale_rate_ocean', code) || 0}
                      onChange={e => setRate('vip_wholesale_rate_ocean', code, parseFloat(e.target.value) || 0)}
                      className="w-full border border-yellow-200 rounded-lg px-2 py-1.5 text-sm bg-white"
                    />
                  </div>
                </div>
              </div>
            </td>
          </tr>
        )}
        
      </React.Fragment>
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
              <h2 className="font-bold text-gray-900 mb-4">Global Variables</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { concept: 'insurance_pct', label: 'Insurance (%)', multiplier: 100, suffix: '%' },
                  { concept: 'easypost_markup', label: 'Markup EasyPost (multiplicador)', multiplier: 1, suffix: 'x' },
                  { concept: 'handling_standard', label: 'Standard Handling /lb', multiplier: 1, suffix: '$' },
                  { concept: 'handling_vip', label: '	VIP Handling /lb', multiplier: 1, suffix: '$' },
                  { concept: 'ttd_exchange_rate', label: 'TTD Exchange Rate (TT$)', multiplier: 1, suffix: 'TT$' },
                  { concept: 'storage_per_cuft_per_month', label: 'Storage /ft³/month', multiplier: 1, suffix: '$' },
                  { concept: 'storage_free_days', label: 'Free storage days', multiplier: 1, suffix: 'days' },
                  { concept: 'processing_fee_pct', label: 'Stripe Processing Fee (%)', multiplier: 100, suffix: '%' },
                ].map(({ concept, label, multiplier, suffix }) => (
                  <div key={concept}>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">{label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                       value={parseFloat((getRate(concept) * multiplier).toFixed(4))}
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
                Special Charges / Hazmat
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { concept: 'hazmat_prep_fee', label: 'Hazmat Prep Fee' },
                  { concept: 'hazmat_shipping_line_fee', label: 'Hazmat Shipping Line Fee' },
                  { concept: 'air_hazmat_fee', label: 'Air Hazmat Compliance Fee' },
                  { concept: 'eei_fee', label: 'EEI Filing (Customs)' },
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
              <h2 className="font-bold text-gray-900 mb-4">Warehouse Handling (Physical Pickup)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { concept: 'handling_mini_0_10lbs', label: 'Mini (0-10 lbs)' },
                  { concept: 'handling_standard_11_50lbs', label: '	Standard (11-50 lbs)' },
                  { concept: 'handling_heavy_51_150lbs', label: 'Heavy (51-150 lbs)' },
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

            {/* Maritime Containers */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-4">Maritime Containers</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { concept: 'container_eh', label: 'EH Container' },
                  { concept: 'container_e', label: 'E Container' },
                  { concept: 'container_d', label: 'D Container' },
                  { concept: 'container_jumbo_fiber', label: 'Jumbo Fiber' },
                  { concept: 'container_caja_regular', label: 'Regular Box' },
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

            {/* Buzón Virtual */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-4">📬 Virtual Mailbox</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
       {[
      { concept: 'mailbox_basic_monthly', label: 'Basic Plan ($/month)' },
      { concept: 'mailbox_premium_monthly', label: 'Premium Plan ($/month)' },
      { concept: 'mailbox_scan_per_envelope', label: 'Scan per envelope ($)' },
      { concept: 'mailbox_shred_per_envelope', label: 'Shred per envelope ($)' },
      { concept: 'mailbox_storage_free_days', label: 'Basic free storage (days)' },
      { concept: 'mailbox_premium_storage_free_days', label: 'Premium free storage (days)' },
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

  {/* Stripe Price IDs */}
  <div className="mt-4 pt-4 border-t border-gray-100">
    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Stripe Price IDs</p>
    <p className="text-xs text-gray-400 mb-3">These must match your Stripe dashboard price IDs.</p>
    <div className="space-y-3">
      {[
        { key: 'stripe_mailbox_basic_price_id', label: 'Basic Plan Price ID' },
        { key: 'stripe_mailbox_premium_price_id', label: 'Premium Plan Price ID' },
      ].map(({ key, label }) => (
        <div key={key}>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">{label}</label>
          <input
            type="text"
            placeholder="price_..."
            value={mailboxPriceIds[key as keyof typeof mailboxPriceIds] || ''}
            onChange={e => setMailboxPriceIds(prev => ({ ...prev, [key]: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono"
          />
        </div>
      ))}
    </div>
  </div>
</div>
          </div>
        )}

        {/* TAB: DELIVERY LOCAL */}
{activeTab === 'local' && (
  <div className="space-y-4">
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="font-bold text-gray-900 mb-4">Local Delivery Miami</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { concept: 'local_base_radius_miles', label: 'Base radius included (miles)' },
          { concept: 'local_per_mile_car_suv', label: '	Per mile — Car/SUV' },
          { concept: 'local_per_mile_minivan', label: 'Per mile — Minivan' },
          { concept: 'local_per_mile_cargo_van', label: 'Per mile — Cargo Van' },
          { concept: 'local_per_mile_box_truck', label: 'Per mile — Box Truck' },
          { concept: 'local_pre_built_pallet_flat', label: 'Pre-built pallet (flat)' },
          { concept: 'local_pre_built_radius_miles', label: 'Pre-built pallet radius (miles)' },
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

    {/* Tarifas Pickup por Pallet */}
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="font-bold text-gray-900 mb-4">📦 Pallet Pickup (151+ lbs)</h2>
      <p className="text-xs text-gray-400 mb-4">Base price per vehicle — pure transport without warehouse service.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { concept: 'local_pallet_cargo_van_1', label: 'Cargo Van — 1 Pallet' },
          { concept: 'local_pallet_cargo_van_2', label: 'Cargo Van — 2 Pallets' },
          { concept: 'local_pallet_box_truck_3', label: 'Box Truck — 3 Pallets' },
{ concept: 'local_pallet_box_truck_4', label: 'Box Truck — 4 Pallets' },
{ concept: 'local_pallet_box_truck_5', label: 'Box Truck — 5 Pallets' },
{ concept: 'local_pallet_box_truck_6', label: 'Box Truck — 6 Pallets' },
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

    {/* Días de entrega por vehículo */}
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="font-bold text-gray-900 mb-4">🚗 Delivery Days by Vehicle</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { code: 'car_suv', label: 'Car/SUV' },
          { code: 'minivan', label: 'Minivan' },
          { code: 'cargo_van', label: 'Cargo Van' },
          { code: 'box_truck', label: 'Box Truck' },
        ].map(({ code, label }) => (
          <div key={code}>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">{label}</label>
            <select
              value={getTextRate('local_days', code)}
              onChange={e => setTextRate('local_days', code, e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">— Select —</option>
              <option value="same_day">Same day</option>
              <option value="next_day">Next day</option>
              <option value="2_3_days">2-3 days</option>
              <option value="3_5_days">3-5 days</option>
              <option value="5_7_days">5-7 days</option>
              <option value="7_14_days">7-14 days</option>
              <option value="14_21_days">14-21 days</option>
              <option value="15_21_days">15-21 days</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  </div>
)}

        {/* TAB: DRIVER PAY */}
        {activeTab === 'driver' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-1">Driver Commission</h2>
            <p className="text-sm text-gray-500 mb-5">Percentage of the total paid that the driver receives automatically via Stripe.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { concept: 'driver_commission_pickup', label: 'Local Delivery / Pickup (%)' },
                { concept: 'driver_commission_consolidation', label: 'Consolidation (%)' },
                { concept: 'driver_commission_package_per_lb', label: 'Package — per lb ($)' },
              ].map(({ concept, label }) => (
                <div key={concept}>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">{label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={getRate(concept)}
                      onChange={e => setRate(concept, null, parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    />
                    <span className="text-gray-400 text-sm">
                      {concept.includes('per_lb') ? '$/lb' : '%'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-xl text-xs text-blue-600">
              💡 Example: 70% on a $100 delivery = driver receives $70 automatically via Stripe Connect.
            </div>
          </div>
        )}

        {/* TAB: API KEYS */}
        {activeTab === 'apis' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-1">API Connections</h2>
            <p className="text-sm text-gray-500 mb-5">Your credentials are stored securely and never shared.</p>
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