"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Loader2, Check } from 'lucide-react';

const ROLES = [
  { value: 'CLIENTE',      label: 'Client',      color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'DRIVER',       label: 'Driver',       color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'WAREHOUSE',    label: 'Warehouse',    color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'CONSOLIDATION',label: 'Consolidation',color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'ADMIN',        label: 'Admin',        color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'B2B_STORE',    label: 'B2B Store',    color: 'bg-teal-100 text-teal-800 border-teal-200' },
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
  const [showB2BModal, setShowB2BModal] = useState(false);
  const [b2bName, setB2bName] = useState('');
  const [b2bAddress, setB2bAddress] = useState('');
const [b2bCreditLimit, setB2bCreditLimit] = useState('500');

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
        body: JSON.stringify({ userId, role, countryCode, b2bName, b2bAddress, b2bCreditLimit: parseFloat(b2bCreditLimit) }),
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
          onClick={() => role === 'B2B_STORE' ? setShowB2BModal(true) : setConfirming(true)}
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

      {/* B2B Setup Modal */}
{showB2BModal && (
  <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: '16px' }}>
    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
      <h3 className="font-bold text-lg text-gray-800 mb-1">Setup B2B Account</h3>
      <p className="text-xs text-gray-400 mb-4">This info will appear in the B2B dashboard and invoices.</p>
      
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Business Name</label>
          <input
            type="text"
            value={b2bName}
            onChange={e => setB2bName(e.target.value)}
            placeholder="e.g. Alejandra's Pharmacy"
            className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-400 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Business Address (Pickup)</label>
          <input
            type="text"
            value={b2bAddress}
            onChange={e => setB2bAddress(e.target.value)}
            placeholder="e.g. 1234 NW 7th Ave, Miami FL 33136"
            className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-400 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monthly Credit Limit ($)</label>
          <input
            type="number"
            value={b2bCreditLimit}
            onChange={e => setB2bCreditLimit(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-400 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex gap-2 mt-5">
        <button
          onClick={() => { setShowB2BModal(false); setConfirming(true); }}
          disabled={!b2bName || !b2bAddress}
          className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 transition disabled:opacity-40"
        >
          Continue
        </button>
        <button
          onClick={() => setShowB2BModal(false)}
          className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}