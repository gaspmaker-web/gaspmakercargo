"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Loader2, Check } from 'lucide-react';

const ROLES = [
  { value: 'CLIENTE',   label: 'Client',   color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'DRIVER',    label: 'Driver',    color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'WAREHOUSE', label: 'Warehouse', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'ADMIN',     label: 'Admin',     color: 'bg-red-100 text-red-800 border-red-200' },
];

const COUNTRIES = [
  { code: 'GD', name: 'Grenada' },
  { code: 'TT', name: 'Trinidad & Tobago' },
  { code: 'BB', name: 'Barbados' },
  { code: 'JM', name: 'Jamaica' },
  { code: 'US', name: 'United States' },
  { code: 'VI', name: 'St. Thomas' },
  { code: 'LC', name: 'St. Lucia' },
  { code: 'VC', name: 'St. Vincent' },
  { code: 'AG', name: 'Antigua' },
  { code: 'DM', name: 'Dominica' },
];

interface Props {
  userId: string;
  currentRole: string;
  currentCountryCode?: string;
}

export default function RoleManager({ userId, currentRole, currentCountryCode }: Props) {
  const router = useRouter();
  const [role, setRole] = useState(currentRole?.toUpperCase() || 'CLIENTE');
  const [countryCode, setCountryCode] = useState(currentCountryCode || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleSave = async () => {
    if (role === 'DRIVER' && !countryCode) {
      alert('Selecciona el país del driver');
      return;
    }
    setConfirming(false);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role, countryCode }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          router.refresh();
        }, 2000);
      } else {
        const data = await res.json();
        alert(data.error || 'Error actualizando rol');
      }
    } catch (e) {
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const currentRoleInfo = ROLES.find(r => r.value === role);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Shield size={20} className="text-gmc-dorado-principal" />
        <h2 className="font-bold text-gmc-gris-oscuro text-sm uppercase tracking-wide">
          Role & Access
        </h2>
      </div>

      {/* Role selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {ROLES.map(r => (
          <button
            key={r.value}
            onClick={() => setRole(r.value)}
            className={`py-2 px-3 rounded-xl border-2 text-sm font-bold transition-all ${
              role === r.value
                ? `${r.color} border-current shadow-sm scale-105`
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Country selector — solo para DRIVER */}
      {role === 'DRIVER' && (
        <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
            Driver Country
          </label>
          <select
            value={countryCode}
            onChange={e => setCountryCode(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-gmc-dorado-principal focus:border-transparent"
          >
            <option value="">Select a country...</option>
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
            ))}
          </select>
        </div>
      )}

      {/* Confirmation + Save */}
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          disabled={loading || success}
          className="w-full py-2.5 bg-gmc-gris-oscuro text-white rounded-xl font-bold text-sm hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {success ? (
            <><Check size={16} className="text-green-400" /> Saved</>
          ) : (
            'Save Role'
          )}
        </button>
      ) : (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm font-bold text-yellow-800 mb-3">
            Change role to <span className={`px-2 py-0.5 rounded ${currentRoleInfo?.color}`}>{role}</span>
            {role === 'DRIVER' && countryCode ? ` — ${countryCode}` : ''}?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Confirm
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}